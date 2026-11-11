# Plan 003: Flag marketplace tag limits before the seller copies tags

> **Executor instructions**: Follow this plan step by step and run every
> verification. Stop and report on any STOP condition. When done, update this
> plan's row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5960b80..HEAD -- lib/marketplaces.ts app/app/page.tsx test/`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 001 (same component; land 001 first to avoid conflicts)
- **Category**: direction / correctness
- **Planned at**: commit `5960b80`, 2026-11-11

## Why this matters

`ROADMAP.md` item 1 says copied output must respect "the selected marketplace's
field limits". The title is the only field checked today
(`app/app/page.tsx:732-736`). The Etsy prompt asks for "13 tags of up to 20
chars each" (`lib/marketplaces.ts:40`), and the Poshmark prompt asks for tags
"under 25 chars" (`lib/marketplaces.ts:50`). Neither limit is checked, and tags
are read-only (`page.tsx:783-787`), so the seller cannot fix an over-limit tag
before "Copy tags".

## Current state

- `lib/marketplaces.ts:24-62`: `MARKETPLACE_CONFIG` holds `name`, `titleLimit` and `guidance` for each marketplace. Limits appear only as prose inside `guidance`.
- `app/app/page.tsx:357`: `const titleLimit = MARKETPLACE_CONFIG[listingFor].titleLimit;` reads its limit from the config. Mirror this for tags.

## Scope

**In scope**: `lib/marketplaces.ts`, `app/app/page.tsx`, a new `test/marketplaces.test.ts` and `test/generator-page.test.tsx`.
**Out of scope**: truncating model output on the server, and the other marketplaces' limits unless they are verified against current marketplace documentation.

## Steps

1. Add optional `tagLimit?: { count?: number; length?: number }` to `MarketplaceConfig`. Set Etsy to `{ count: 13, length: 20 }` and Poshmark to `{ length: 25 }`. Interpolate these values into `guidance`, so the prompt and the check share one source. Follow the existing `titleLimit` interpolation at line 84.
2. In the tags section, mark over-length tags with the existing `limit-warning` class. Show a count line like the title's ("14 / 13 tags · Over the Etsy limit").
3. Optional, if it stays small: make tags removable with a per-tag remove button, so the seller can bring the list within limits.
4. Add tests: the config values reach the prompt (`buildUserPrompt("etsy", {})` contains "13"), and the jsdom studio shows the warning for an over-limit Etsy fixture.

**Verify**: `pnpm test --maxWorkers=1` passes; `pnpm typecheck` and `pnpm lint` exit 0.

## STOP conditions

- You cannot confirm the Etsy limits (13 tags, 20 characters) from current Etsy seller documentation. Report and do not guess.

## Maintenance notes

- The Poshmark title limit (`titleLimit: 50`) may be out of date. Verify it against current marketplace documentation before relying on it; it is listed as an open item in the README.
