# Reliability audit — 2026-11-06

## Baseline and inventory (recorded before implementation)

Clean isolated worktree at current remote default `7b5a582` (merged untangle #49).
Read AGENTS.md, CLAUDE.md, product/setup/design and previous audit decisions.
Tests and builds are CI-only; no local execution is claimed.

Reviewed public landing/legal pages, `/app`, shared UI/CSS, `/api/generate`,
listing/request contracts, marketplace prompts, image ingestion, eBay OAuth/search,
all existing tests, tooling, workflows and product boundaries.

Public interfaces: four marketplaces, 1–5 compressed photos and optional seller
fields produce an editable listing, optional asking-price comparisons and advisory
remaining count. No account, tenant store, database, publishing or history exists.
Photos/details cross the OpenRouter boundary; eBay receives a title query only.
HTTP-only cookies are user-controlled advisory accounting, explicitly not a hard
quota. Drafts are transient; regeneration warns about replacing edits.

Success/failure tracing: bounded streamed request validation precedes providers;
invalid media and oversized input do not consume allowance. Provider schema errors
fall through sequentially, comparisons fail open, failed generation sets no cookies.
Client upload epochs, request identity, abort and clipboard epochs guard stale work.
Input changes mark old drafts stale; reset clears transient state. OAuth/search have
8-second timeouts; the model calls currently have none. No transaction/persistence
or tenant isolation contract is applicable.

## Confirmed findings

1. **Medium, high confidence — malformed advisory cookies break successful responses.**
   `app/api/generate/route.ts`: `Number(cookie)` accepts NaN, negative and fractional
   values; NaN bypasses the quota check and serializes remaining as null, rejected
   by the browser response schema. A malformed session also becomes part of a
   cookie name after generation. Normalize untrusted session/count input before
   provider work; preserve existing well-formed sessions and integer accounting.
   Expected: a valid listing remains usable and allowance is a finite integer.
2. **Medium, high confidence — stalled provider prevents fallback.**
   `app/api/generate/route.ts`: no SDK timeout/signal bounds generation. A hung first
   provider prevents later models and can exhaust the route's 60-second budget;
   the browser's 90-second timeout only stops waiting. Bound each attempt so the
   four default attempts plus optional 16-second eBay calls fit the route budget.

## Rejected hypotheses / boundaries

- Cookie reset and concurrent undercount are documented advisory behavior; adding
  identities, persistence or payments would invent requirements.
- Signature checks intentionally do not fully decode server-side images; bounded
  payloads and provider rejection already guard this boundary.
- Optional eBay outage must not fail a valid generation; existing tests protect it.
- Client cancellation explicitly warns the server may finish; no claim of refunded
  usage or server cancellation is made.
- No structural cleanup or unrelated dependency refresh is warranted.

## Validation plan

Keep all existing Vitest checks. Add cookie and stalled-provider regressions and
CI-only pre-fix proof. Add pinned published `e2e` + `@e2e-dev/web` deterministic
browser journeys with offline request fixtures: photo ingestion, seller inputs,
generation, editing/copy, failed regeneration recovery and reset. Run production
build and browser suite only in CI, upload failure evidence. No model calls or
provider credentials are needed. Independent review will challenge findings and
implementation before merge.

## Implementation and framework evidence

The route now normalizes session/count cookies and aborts each model request after
9 seconds using the SDK's native abort signal. Four default attempts take at most
36 seconds before up to 16 seconds of optional comparisons, within maxDuration 60.
No general-purpose timeout wrapper or new production dependency was needed.

Published package metadata verified `e2e@0.23.0` and `@e2e-dev/web@0.15.5`
(peer `e2e >=0.22.1 <1`, pinned Playwright core 1.64.1). Both require Node
^22.22.3 or >=24.8; repository Node 24.22.1 meets this. Read the published installed
guide plus upstream quickstart/CI/GitHub Actions docs. Installation suppressed all
lifecycle scripts. These dependencies were selected because the user explicitly
requested tester-army/e2e, and the web engine directly supports deterministic
locators, upload, request interception, and browser assertions without model keys.

The browser journey runs against a CI production build. It exercises real image
compression/upload, seller inputs and marketplace selection, transmitted request,
editable draft/copy, failed regeneration preserving edits, retry and reset. The
API response and clipboard are controlled fixtures; provider transport, validation,
fallback and accounting are independently covered by existing/new Vitest tests.
This does not claim live provider availability or successful external publishing
(which this product does not implement). Failure traces/video/reports are uploaded.

Independent review identified shallow checkout preventing baseline proof; fixed
with full history. It also requested verifying named failures rather than treating
arbitrary runner errors as a successful reproduction; proof now checks the JSON
report for all five targeted failing cases. CI results remain pending.

CI run [42307030923](https://github.com/aranlucas/snaphaul/actions/runs/42307030923)
passed all 58 tests, typecheck and formatting, including the 9-second abort/fallback
regression. Lint stopped subsequent build/browser/proof stages: new tests needed
statement spacing and safe parsed JSON/error/session types. Corrected those test
issues without weakening assertions. Production build/browser/proof remain pending.
Vercel reports an account block and is excluded under the user policy.

CI run [42307307733](https://github.com/aranlucas/snaphaul/actions/runs/42307307733)
passed 58 tests, lint, typecheck, formatting, all five pre-fix failure checks and
the production build. Browser trace/video showed upload, request validation,
generation, edit and copy succeeding, then a test-only ambiguous alert locator
on the intentional 502 response. Scoped that locator by its expected error text;
retained the assertion and all later recovery/reset checks. Browser rerun pending.
