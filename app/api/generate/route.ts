import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { SYSTEM_PROMPT } from "../../../lib/marketplaces";
import { generateListing, ListingSchema } from "../../../lib/generate-listing";
import { getEbayComps } from "../../../lib/ebay";

export const runtime = "nodejs";
export const maxDuration = 60;

const FREE_LIMIT = 10;

// Free vision models rotate in/out of OpenRouter's free tier; try in order.
const MODELS = (
  process.env.OPENROUTER_MODEL
    ? [process.env.OPENROUTER_MODEL]
    : [
        "google/gemma-4-31b-it:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        "nvidia/nemotron-nano-12b-v2-vl:free",
        "google/gemma-4-26b-a4b-it:free",
      ]
).filter((m, i, arr) => arr.indexOf(m) === i);

export async function POST(req: NextRequest) {
  // Advisory per-browser allowance, not abuse protection: cookies can be cleared
  // or changed and parallel requests can share a count. A hard budget needs a
  // durable, atomic server-owned store and a defined anonymous identity policy.
  const sid = req.cookies.get("sh_session")?.value ?? crypto.randomUUID();
  const used = Number(req.cookies.get(`sh_used_${sid}`)?.value ?? 0);
  if (used >= FREE_LIMIT) {
    return NextResponse.json(
      { error: `You've used all ${FREE_LIMIT} free generations. Unlimited access is coming soon!` },
      { status: 429 },
    );
  }

  const outcome = await generateListing(req, {
    models: MODELS,
    async generate({ model, prompt, images }) {
      if (!process.env.OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");
      const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
      const result = await generateObject({
        model: openrouter(model),
        schema: ListingSchema,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...images.map(({ data, mediaType }) => ({ type: "file" as const, data, mediaType })),
            ],
          },
        ],
        temperature: 0.7,
        maxOutputTokens: 2000,
        maxRetries: 0,
      });
      return result.object;
    },
    getComps: getEbayComps,
  });
  if (outcome.kind === "invalid-input") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (outcome.kind === "too-large") {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }
  if (outcome.kind === "provider-failed") {
    return NextResponse.json({ error: "Generation failed, please try again." }, { status: 502 });
  }
  const { listing, comps } = outcome;

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
