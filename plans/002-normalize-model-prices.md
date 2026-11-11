# Plan 002: Generated prices are always positive and internally consistent

> **Executor instructions**: Follow this plan step by step and run every
> verification. Stop and report on any STOP condition. When done, update this
> plan's row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5960b80..HEAD -- lib/listing-contract.ts lib/generate-listing.ts test/generate-listing.test.ts`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `5960b80`, 2026-11-11

## Why this matters

The model's price output is shown as guidance and copied straight into the
"Full listing" text. `ListingSchema` accepts any numbers: negative or zero
prices, an inverted range such as `[40, 10]`, or a suggested price outside its
own range. Free models are the default, and they produce exactly these slips.
The UI would then show "Range $40–10" and the seller would copy it as-is.
`PRODUCT.md` says to "state price … limitations plainly". Incoherent numbers
undercut that.

## Current state

- `lib/listing-contract.ts:18-19`: `price_suggested: z.number(),` and `price_range: z.tuple([z.number(), z.number()]),` have no bounds.
- `lib/generate-listing.ts:155`: `listing = ListingSchema.parse(await dependencies.generate(...))`. A parse failure falls back to the next model, which is the existing contract for malformed output (see the test "malformed model output falls back instead of returning an invalid listing").
- `app/app/page.tsx:41` and `:795-797` render and copy the prices verbatim.

## Scope

**In scope**: `lib/listing-contract.ts`, `lib/generate-listing.ts` and `test/generate-listing.test.ts`.
**Out of scope**: the UI, the prompt text and the comparison maths in `lib/ebay.ts`.

## Steps

1. Make `price_suggested` and both range values `z.number().positive()`, so a non-positive price is malformed output and falls back to the next model.
   This also flows into the AI SDK's JSON schema. Confirm the route test that uses the offline HTTP adapter still passes.
2. In `generateListing`, after a successful parse, normalize the result. Sort `price_range` ascending and clamp `price_suggested` into the range.
   Normalize rather than reject, because discarding an otherwise good listing over ordering costs the seller a whole fallback attempt.
3. Add tests in `test/generate-listing.test.ts`, following "malformed model output falls back…":
   - An inverted range is returned sorted.
   - An out-of-range suggestion is clamped.
   - A negative price makes the first model fall back to the second.

**Verify**: `pnpm test --maxWorkers=1` passes; `pnpm typecheck` and `pnpm lint` exit 0.

## STOP conditions

- `ListingSchema` is now shared with a persisted format. Changing the schema would then break stored data.

## Maintenance notes

- If the app ever supports currencies other than USD, revisit the positivity and rounding assumptions.
