# Untangle decisions — 2026-11-06

## Baseline and inventory (before implementation)

Baseline: `98376e8`, clean worktree. Read root AGENTS.md and CLAUDE.md;
no nested guidance. Comments and test cleanup selected. Tests and builds run
only in CI by user instruction. No owned local test processes were running.
No baseline test result is claimed.

Reviewed all application routes, shared UI, library modules, tests, CSS,
package/tooling/CI configuration, product/setup/legal/design/launch/roadmap docs.
Existing recent test and documentation simplifications are retained.

## Design and work list

- Define browser-safe generation contracts in `lib/listing-contract.ts`.
  - Hidden link: client repeats ListingSchema, Listing and Comps independently
    of server validation and eBay results. A field change requires synchronized
    edits with no dependency expressing the relationship.
  - Hidden link: photo MIME types, count and decoded byte ceiling are duplicated
    in upload UI and request validation. Compression and request bounds remain
    separate policies; source files may be larger than transmitted images.
- Put seller field definitions in `lib/marketplaces.ts`, alongside prompt inputs.
  - Hidden link: UI field lengths and names repeat server validation limits and
    the prompt's SellerDetails type. Derive validation and rendering from one
    definition; preserve field order, labels and optional/empty input behavior.
- Make eBay comparisons an entirely optional operation.
  - Special case: getToken runs outside getEbayComps' catch; OAuth network or
    schema failures throw while Browse failures return null. Move the whole
    operation inside its failure boundary and bound OAuth waiting like Browse.
    Keep token reuse and minimum five numeric asking prices.
- Remove surplus placeholder/redundant comments and model-list deduplication
  (the configured singleton and fixed distinct defaults cannot contain duplicates).
  Preserve security, provider, accessibility and memory rationale and lint directives.
- Retain behavior-focused tests. Existing validation, fallback, quota, image,
  key stability, legal navigation and drag/drop tests catch credible regressions.
  Add OAuth outage/malformed-response regression cases: expected absent comps
  follows the optional adapter contract, rather than reproducing its algorithm.

## Deliberately retained requirements

- Ordered provider fallback avoids charging for parallel model calls. Optional
  comparisons must not discard a successful listing.
- Bounded stream cancellation and permissive-base64 safeguards protect the API.
- Upload/copy epochs, abort identity and revision tracking prevent stale async
  results after reset, cancellation or unmount; extracting them solely for file
  size would hide their coordinated lifecycle. Keep the studio together.
- Cookie quota remains explicitly advisory; persistence/identity is a product
  decision, not a refactor. Etsy-specific eligibility guidance is domain policy.
- Native legal page composition and icon mapping are small, clear shared UI.
  No speculative component system, dependency additions or document rewrites.
- CI already runs Vitest, lint, formatting and typecheck on every non-draft PR.
  No local tests, benchmark, browser test or test build will be run.

## Validation and review

First independent review identified further copies: MIME regex allowlist,
unused marketplace id fields, numeric title limits inside guidance, and a manual
JSON example repeating ListingSchema. Remove the first three and put semantic
output hints in Zod descriptions so AI SDK supplies one authoritative schema.
The unused image icon variant also had no caller and was removed.
These are small refinements to the shared-contract design. Existing tests remain.
OAuth error cases added for rejection, malformed payload, and HTTP failure.

Implementation complete; sequential independent re-review and CI pending.
Dependency install used --ignore-scripts. Formatting only; no local tests/builds.

Local static lint completed successfully. git diff --check is clean. The installed
Next.js 16.4.4 use-client, route-handler and client/server-boundary guides were
read before code edits. No local behavioral validation was performed.

Final independent whole-repository review found no worthwhile issues remaining.
All first-round findings are resolved; meaningful tests were retained. CI is the
remaining validation gate before merge. No dependencies or custom scripts added.
