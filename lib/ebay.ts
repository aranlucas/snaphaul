// Real pricing comps from eBay's Browse API. Activates only when
// EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are set; callers get null otherwise.
// These are asking prices of similar live listings — labeled honestly in the UI,
// not claimed as sold prices.

type Comps = {
  count: number;
  median: number;
  p25: number;
  p75: number;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.EBAY_CLIENT_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });
  if (!res.ok) return null;
  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.token;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}

export async function getEbayComps(query: string): Promise<Comps | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    url.searchParams.set("q", query.slice(0, 90));
    url.searchParams.set("limit", "40");
    url.searchParams.set("filter", "conditionIds:{1000|1500|2000|2500|3000|4000|5000}");

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const prices: number[] = (data.itemSummaries ?? [])
      .map((i: { price?: { value?: string } }) => Number(i.price?.value))
      .filter((n: number) => Number.isFinite(n) && n > 0)
      .sort((a: number, b: number) => a - b);
    if (prices.length < 5) return null;
    return {
      count: prices.length,
      median: percentile(prices, 50),
      p25: percentile(prices, 25),
      p75: percentile(prices, 75),
    };
  } catch {
    return null;
  }
}
