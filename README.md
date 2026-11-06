# Snaphaul 📸 · Snap a photo. Get a listing that sells.

[![CI](https://github.com/aranlucas/snaphaul/actions/workflows/ci.yml/badge.svg)](https://github.com/aranlucas/snaphaul/actions/workflows/ci.yml)

Snaphaul turns one to five item photos into a marketplace-ready listing for
eBay, Etsy, Poshmark, or Mercari. It identifies the item, writes a
marketplace-specific title and description, suggests item specifics and tags,
and returns a price suggestion with a range. It is built for the reseller
whose inventory grows faster than they can write the 47th listing of the day.

![Snaphaul preview](public/og.png)

The public beta offers ten successful generations per browser cookie allowance,
without an account. This cookie-based allowance is advisory: clearing or
changing cookies resets it, and concurrent requests can share a count. It is not
an enforceable per-person quota or abuse-protection mechanism. A hard budget
requires atomic server-owned persistence and an identity/renewal policy.
Treat the generated copy, category, condition, and
price as suggestions: the seller remains responsible for accuracy and each
marketplace's rules.

## Run locally

Use the Node version in [.node-version](.node-version) and the pnpm version in
[package.json](package.json).

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs through [Portless](https://github.com/vercel-labs/portless). Open
the URL it prints: normally [https://snaphaul.localhost](https://snaphaul.localhost),
with a branch prefix in linked worktrees. The first run may ask for `sudo` to bind
port 443 and trust a local certificate. Build for production with `pnpm build`.

The API route needs a server-side OpenRouter key. Copy it into your local
environment before generating a listing:

```bash
OPENROUTER_API_KEY=... pnpm dev
```

Supported settings:

| Variable                                | Required | Purpose                                                     |
| --------------------------------------- | -------- | ----------------------------------------------------------- |
| `OPENROUTER_API_KEY`                    | yes      | Vision model access for listing generation.                 |
| `OPENROUTER_MODEL`                      | no       | Use a single model instead of the free-model fallback list. |
| `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` | no       | Enables live eBay Browse API asking-price comps.            |
| `APP_URL`                               | no       | Metadata base URL; defaults to the deployed app URL.        |

Without eBay credentials the UI still shows the model's estimate. When enabled,
comps are asking prices from live listings, not sold-price evidence.

## API and data boundaries

The browser compresses images before sending them as data URLs. The route
passes requests through `lib/generate-listing.ts`, which bounds the JSON body to
8 MiB, validates the marketplace/details and one-to-five-image limit, and checks
base64 encoding, MIME type, file signature, and a 1 MiB decoded limit per image.
JPEG, PNG, WebP, and GIF are supported; SVG and other media are rejected. File
signature checks are not a full pixel decode or malware scan. Invalid requests
return 400 (or 413 for oversized bodies) before any model call, without echoing
photo data. The module tries the configured model or free fallback models and
preserves a valid listing if optional comparisons fail. The route sets an HTTP-only
anonymous counter cookie. Photos and typed details are sent to OpenRouter for
generation; the application does not persist them. See the built-in
[privacy policy](app/privacy/page.tsx) and [terms](app/terms/page.tsx) for the
beta boundary.

The beta does not publish listings or retain listing history. Proposed next steps
and their acceptance criteria are in the [roadmap](ROADMAP.md).

## Offline checks

`pnpm test` runs Vitest tests in Node and jsdom with synthetic images and mocked
model/comparison adapters; no OpenRouter or eBay requests are needed. CI runs
tests, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, a production build,
and `pnpm test:e2e`. The pinned tester-army/e2e web journey uses synthetic photos,
controlled API responses and clipboard fixtures without model credentials. CI
uploads browser failure evidence and verifies the new regressions fail against
the pre-audit route. Failed generation or invalid input does not update
the cookie allowance; only a successfully generated listing is counted.
