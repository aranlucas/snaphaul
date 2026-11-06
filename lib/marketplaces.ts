import { z } from "zod";

export const SellerDetailsSchema = z.object({
  brand: z.string().max(200).optional(),
  condition: z.string().max(200).optional(),
  size: z.string().max(200).optional(),
  flaws: z.string().max(500).optional(),
  originalPrice: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

type SellerDetails = z.infer<typeof SellerDetailsSchema>;

export const MARKETPLACES = ["ebay", "etsy", "poshmark", "mercari"] as const;

export type Marketplace = (typeof MARKETPLACES)[number];

type MarketplaceConfig = {
  name: string;
  titleLimit: number;
  guidance: string;
};

export const MARKETPLACE_CONFIG: Record<Marketplace, MarketplaceConfig> = {
  ebay: {
    name: "eBay",
    titleLimit: 80,
    guidance: `eBay best practices:
- Title: front-load the most searched keywords (brand, item type, size, color, model number).
- Use ALL relevant keywords buyers search for; no marketing fluff, no ALL CAPS words, no punctuation stuffing.
- Item specifics should mirror eBay's required fields (Brand, Type, Color, Size, Material, Condition, etc.).
- Description: factual, scannable, short paragraphs or bullets covering condition, measurements, flaws, shipping. No HTML.
- Suggest the most likely eBay leaf category.`,
  },
  etsy: {
    name: "Etsy",
    titleLimit: 140,
    guidance: `Etsy best practices:
- Title: long-tail keyword phrases buyers actually search, most important keywords first.
- 13 tags of up to 20 chars each, multi-word long-tail phrases, no repeated single words.
- Description: warm and human but keyword-rich first paragraph (Etsy indexes it), then details, measurements, condition, care.
- Only suggest this fits Etsy if the item is vintage (20+ years), handmade, or a craft supply; note this in category.`,
  },
  poshmark: {
    name: "Poshmark",
    titleLimit: 50,
    guidance: `Poshmark best practices:
- Title: Brand + Item Type + Size + Key Attribute (color/style).
- Description: casual, emoji-friendly, hashtag-heavy (Poshmark rewards hashtags); include brand, size, measurements, condition, styling suggestions.
- Tags should be Poshmark-style hashtags without the # symbol, each under 25 chars.`,
  },
  mercari: {
    name: "Mercari",
    titleLimit: 80,
    guidance: `Mercari best practices:
- Title: Brand + Item Type + Size/Model + Key Attributes (color, style). Keyword-rich, no filler.
- Description: friendly and detailed — condition, measurements, flaws, what's included, bundle/offer welcome note. Buyers negotiate heavily on Mercari, so mention you're open to offers.
- End the description with up to 5 relevant hashtags (with # symbol).
- Item specifics mirror Mercari's fields (Brand, Size, Color, Condition, Category).
- Suggest price slightly above target since buyers will send lower offers.`,
  },
};

export const SYSTEM_PROMPT = `You are an expert e-commerce reseller and SEO copywriter who has listed tens of thousands of items across eBay, Etsy, and Poshmark. You identify items from photos with high accuracy, note brands, era, materials, and flaws, and you write listings that sell. You always respond with valid JSON only — no markdown fences, no commentary.`;

export function buildUserPrompt(marketplace: Marketplace, details: SellerDetails): string {
  const cfg = MARKETPLACE_CONFIG[marketplace];

  const detailLines = Object.entries(details)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const detailsBlock = detailLines
    ? `Seller-provided details (authoritative — trust these over what you see in photos):\n${detailLines}`
    : "No seller-provided details; infer everything from the photos.";

  return `Write an optimized ${cfg.name} listing for the item shown in the photo(s).

${detailsBlock}

${cfg.guidance}

Follow the supplied output schema. Keep the title within ${cfg.titleLimit} characters.

Rules:
- Currency USD. If unsure of exact value, widen the range and say so in price_reasoning.
- Every item_specific and tag must be relevant; never invent a brand or model number you cannot see or were not told.
- JSON only.`;
}
