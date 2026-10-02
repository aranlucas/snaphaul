import { z } from "zod";
import { MARKETPLACES, buildUserPrompt } from "./marketplaces";

// The browser currently sends <= 0.4 MiB JPEGs. Leave headroom for other clients
// while bounding both the wire payload and each decoded image before model work.
export const MAX_IMAGE_BYTES = 1024 * 1024;
export const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const MAX_BASE64_LENGTH = 4 * Math.ceil(MAX_IMAGE_BYTES / 3);

export const ListingSchema = z.object({
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

type Listing = z.infer<typeof ListingSchema>;
type Image = { data: Uint8Array; mediaType: string };
type Comps = { count: number; median: number; p25: number; p75: number };
type GenerationDependencies = {
  models: readonly string[];
  generate: (input: { model: string; prompt: string; images: Image[] }) => Promise<Listing>;
  getComps: (title: string) => Promise<Comps | null>;
};

type GenerationOutcome =
  | { kind: "invalid-input" }
  | { kind: "too-large" }
  | { kind: "provider-failed" }
  | { kind: "generated"; listing: Listing; comps: Comps | null };

const RequestSchema = z.object({
  marketplace: z.enum(MARKETPLACES),
  images: z
    .array(z.string().max(MAX_BASE64_LENGTH + 32))
    .min(1)
    .max(5),
  brand: z.string().max(200).optional(),
  condition: z.string().max(200).optional(),
  size: z.string().max(200).optional(),
  flaws: z.string().max(500).optional(),
  originalPrice: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

class PayloadTooLarge extends Error {}

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) {
    throw new PayloadTooLarge();
  }
  if (!request.body) throw new Error("Missing body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new PayloadTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks, size).toString("utf8"));
}

function decodeImage(url: string): Image {
  const comma = url.indexOf(",");
  const header = url.slice(0, comma);
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64$/.exec(header);
  if (!match) throw new Error("Unsupported image data URL");
  const encoded = url.slice(comma + 1);
  if (
    !encoded.length ||
    encoded.length > MAX_BASE64_LENGTH ||
    encoded.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
  ) {
    throw new Error("Invalid image encoding");
  }
  const data = Buffer.from(encoded, "base64");
  // Buffer.from is permissive. A canonical round trip rejects bad padding,
  // discarded characters, and unused bits instead of sending them to a model.
  if (data.byteLength > MAX_IMAGE_BYTES || data.toString("base64") !== encoded) {
    throw new Error("Invalid image encoding");
  }
  const mediaType = match[1];
  const signatureMatches =
    (mediaType === "image/jpeg" && data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) ||
    (mediaType === "image/png" &&
      data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (mediaType === "image/gif" &&
      ["GIF87a", "GIF89a"].some((signature) =>
        data.subarray(0, 6).equals(Buffer.from(signature)),
      )) ||
    (mediaType === "image/webp" &&
      data.subarray(0, 4).equals(Buffer.from("RIFF")) &&
      data.subarray(8, 12).equals(Buffer.from("WEBP")));
  if (!signatureMatches) throw new Error("Image content does not match its media type");
  return { data, mediaType };
}

/** Validate the complete request before trying any model. All model fallbacks
 * share the same decoded input; optional comparison failures preserve a listing.
 * This does not enforce the route's advisory anonymous-cookie allowance.
 */
export async function generateListing(
  request: Request,
  dependencies: GenerationDependencies,
): Promise<GenerationOutcome> {
  let input;
  let images;
  try {
    input = RequestSchema.parse(await readBody(request));
    images = input.images.map(decodeImage);
  } catch (error) {
    return { kind: error instanceof PayloadTooLarge ? "too-large" : "invalid-input" };
  }
  const { marketplace, images: _images, ...details } = input;
  const prompt = buildUserPrompt(marketplace, details);
  for (const model of dependencies.models) {
    let listing;
    try {
      listing = ListingSchema.parse(await dependencies.generate({ model, prompt, images }));
    } catch {
      continue;
    }
    // Provider diagnostics may contain input or credentials. Keep them out of
    // client errors; likewise, never echo invalid photo data in validation errors.
    const comps = await dependencies.getComps(listing.title).catch(() => null);
    return { kind: "generated", listing, comps };
  }
  return { kind: "provider-failed" };
}
