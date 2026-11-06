import { z } from "zod";

export const MAX_PHOTOS = 5;
export const IMAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Compression targets 0.4 MiB; other clients may send up to 1 MiB per image.
export const MAX_IMAGE_BYTES = 1024 * 1024;

export const ListingSchema = z.object({
  item_identification: z
    .string()
    .describe("What the item is, including identified brand/model/era and confidence"),
  title: z.string(),
  description: z.string().describe("Full listing description"),
  item_specifics: z.array(z.object({ name: z.string(), value: z.string() })),
  tags: z.array(z.string()),
  category: z.string().describe("Suggested category path"),
  price_suggested: z.number(),
  price_range: z.tuple([z.number(), z.number()]),
  price_reasoning: z
    .string()
    .describe("Short reasoning based on brand, condition, and typical resale value"),
  photo_notes: z.array(z.string()).describe("Notable details or flaws visible in the photos"),
});

export type Listing = z.infer<typeof ListingSchema>;

export const CompsSchema = z.object({
  count: z.number(),
  median: z.number(),
  p25: z.number(),
  p75: z.number(),
});

export type Comps = z.infer<typeof CompsSchema>;

export const GenerationResponseSchema = z.object({
  listing: ListingSchema,
  comps: CompsSchema.nullish(),
  remaining: z.number().optional(),
});
