import { afterEach, expect, test, vi } from "vitest";
import { getEbayComps } from "../lib/ebay";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

test("unconfigured eBay comparisons do not make a request", async () => {
  vi.stubEnv("EBAY_CLIENT_ID", "");
  vi.stubEnv("EBAY_CLIENT_SECRET", "");
  const fetch = vi.spyOn(globalThis, "fetch");
  expect(await getEbayComps("synthetic item")).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

test("validated asking prices keep numeric order and ignore invalid amounts", async () => {
  vi.stubEnv("EBAY_CLIENT_ID", "synthetic-id");
  vi.stubEnv("EBAY_CLIENT_SECRET", "synthetic-secret");
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(Response.json({ access_token: "synthetic-token", expires_in: 0 }))
    .mockResolvedValueOnce(
      Response.json({
        itemSummaries: ["30", "10", "50", "20", "40", "bad", "-1"].map((value) => ({
          price: { value },
        })),
      }),
    );
  expect(await getEbayComps("synthetic item")).toEqual({ count: 5, median: 30, p25: 20, p75: 40 });
});

test("malformed comparison responses return no comparisons", async () => {
  vi.stubEnv("EBAY_CLIENT_ID", "synthetic-id");
  vi.stubEnv("EBAY_CLIENT_SECRET", "synthetic-secret");
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(Response.json({ access_token: "synthetic-token", expires_in: 0 }))
    .mockResolvedValueOnce(Response.json({ itemSummaries: "not an array" }));
  expect(await getEbayComps("synthetic item")).toBeNull();
});
