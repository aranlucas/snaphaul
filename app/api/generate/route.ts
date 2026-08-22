import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { MARKETPLACES, Marketplace, SYSTEM_PROMPT, buildUserPrompt } from "@/lib/marketplaces";
import { getEbayComps } from "@/lib/ebay";

export const runtime = "nodejs";
export const maxDuration = 60;

const FREE_LIMIT = 10;

// Free vision models rotate in/out of OpenRouter's free tier; try in order.
const MODELS = (process.env.OPENROUTER_MODEL
  ? [process.env.OPENROUTER_MODEL]
  : [
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      "nvidia/nemotron-nano-12b-v2-vl:free",
      "google/gemma-4-26b-a4b-it:free",
    ]
).filter((m, i, arr) => arr.indexOf(m) === i);

const ListingSchema = z.object({
  item_identification: z.string(),
  title: z.string(),
  description: z.string(),
  item_specifics: z.array(z.object({ name: z.string(), value: z.string() })),
  tags: z.array(z.string()),
  category: z.string(),
  price_suggested: z.number(),
  price_range: z.tuple([z.number(), z.number()]),
  price_reasoning: z.string(),
  photo_notes: z.array(z.string()),
});

const RequestSchema = z.object({
  marketplace: z.enum(MARKETPLACES),
  images: z.array(z.string().startsWith("data:image/")).min(1).max(5),
  brand: z.string().max(200).optional(),
  condition: z.string().max(200).optional(),
  size: z.string().max(200).optional(),
  flaws: z.string().max(500).optional(),
  originalPrice: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

// data URL -> { base64, mediaType } for the AI SDK file part
function parseDataUrl(dataUrl: string): { data: string; mediaType: string } {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.*)$/);
  if (!match) throw new Error("Invalid image data URL");
  return { data: match[2], mediaType: match[1] };
}

export async function POST(req: NextRequest) {
  // Anonymous session: mint on first generate; no middleware needed.
  const sid = req.cookies.get("sh_session")?.value ?? crypto.randomUUID();
  const used = Number(req.cookies.get(`sh_used_${sid}`)?.value ?? 0);
  if (used >= FREE_LIMIT) {
    return NextResponse.json(
      { error: `You've used all ${FREE_LIMIT} free generations. Unlimited access is coming soon!` },
      { status: 429 }
    );
  }

  let parsed;
  try {
    parsed = RequestSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid request", detail: String(e) }, { status: 400 });
  }

  const { marketplace, images, ...details } = parsed;
  const userPrompt = buildUserPrompt(marketplace as Marketplace, details);
  const content = [
    { type: "text" as const, text: userPrompt },
    ...images.map((url) => {
      const { data, mediaType } = parseDataUrl(url);
      return { type: "file" as const, data, mediaType };
    }),
  ];

  const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

  let listing;
  let comps = null;
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");
    let lastError: unknown = new Error("All models failed");
    for (const model of MODELS) {
      try {
        const result = await generateObject({
          model: openrouter(model),
          schema: ListingSchema,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
          temperature: 0.7,
          maxOutputTokens: 2000,
          maxRetries: 0,
        });
        listing = result.object;
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (!listing) throw lastError;
    // Real comps from eBay (null without API keys or on any failure — UI falls back to the AI estimate)
    comps = await getEbayComps(listing.title).catch(() => null);
  } catch (e) {
    return NextResponse.json(
      { error: "Generation failed, please try again.", detail: String(e).slice(0, 500) },
      { status: 502 }
    );
  }

  const res = NextResponse.json({ listing, comps, remaining: FREE_LIMIT - used - 1 });
  res.cookies.set("sh_session", sid, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  res.cookies.set(`sh_used_${sid}`, String(used + 1), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
