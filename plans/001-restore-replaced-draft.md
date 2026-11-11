# Plan 001: A new draft never silently discards the seller's edited draft

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5960b80..HEAD -- app/app/page.tsx test/generator-page.test.tsx`
> If either file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug (user data loss) / direction (ROADMAP item 1 acceptance criterion)
- **Planned at**: commit `5960b80`, 2026-11-11

## Why this matters

The studio lets a seller edit the generated title and description. A successful
"Generate a new draft" or "Try another marketplace" overwrites `listing` with
the new model output. The seller's edits are then gone for good, and each
replacement uses up one of the ten advisory generations. The UI only warns
with static text ("Copy anything you want to keep first"). `ROADMAP.md` lists
"Regeneration cannot silently replace manual changes" as an acceptance
criterion. After this plan lands, the studio keeps the draft it replaced, says
the replacement happened, and offers a one-click restore. Restoring swaps the
two drafts, so neither draft and no spent generation is lost.

## Current state

- `app/app/page.tsx`: the whole studio. It is a single client component, and
  `docs/untangle-decisions.md` records the decision to keep it together. Do not
  split it.
  - Lines 48–50 and 60–61 hold the draft state: `listing`, `listingFor`,
    `comps`, `revision` and `draftRevision`.
  - Lines 275–279 run after a successful generation and overwrite the draft:
    ```tsx
    const data = parsed.data;
    setListing(data.listing);
    setListingFor(mp);
    setDraftRevision(sourceRevision);
    setComps(data.comps ?? null);
    ```
  - Lines 619–623 show static copy, "A new draft replaces your edits. Copy anything you want to keep first."
  - Lines 820–822 (the rework section) say "Creates a new draft and replaces this one. Copy your edits first."
  - `reset()` (lines 193–213) clears the draft state.
  - Lines 624–638 show the existing feedback-and-action pattern to match: a
    `.feedback` block with a `.text-button` action ("Try again").
- `test/generator-page.test.tsx`: jsdom tests for the studio (drag state only).
  The Vitest `browser` project runs `test/**/*.test.tsx` in jsdom with
  `test/vitest.setup.ts`.
- `tests/studio.e2e.ts` already proves that a failed regeneration keeps edits.
  Do not change it.

## Commands you will need

| Purpose   | Command                                             | Expected on success |
| --------- | --------------------------------------------------- | ------------------- |
| Tests     | `pnpm test --maxWorkers=1`                          | all pass            |
| Typecheck | `pnpm typecheck`                                    | exit 0              |
| Lint      | `pnpm lint`                                         | exit 0, 0 warnings  |
| Format    | `pnpm format:check`                                 | exit 0              |
| Build     | `NODE_OPTIONS=--max-old-space-size=1200 pnpm build` | exit 0              |

## Scope

**In scope**: `app/app/page.tsx`, `test/generator-page.test.tsx`, a new `app/components/photo-preparation.ts` (see "Implementation record") and one added step in `tests/studio.e2e.ts`.

**Out of scope**:

- Persistence (localStorage or a saved draft library). That is ROADMAP item 1 as a whole and needs its own design.
- The API route and `lib/*`.
- More than one level of history.
- Any other change to `tests/studio.e2e.ts`.

## Steps

### Step 1: Keep the replaced draft

Add a `previousDraft` state of type `{ listing, marketplace, comps, revision, edited } | null`.
Track whether the current draft has seller edits: set an `edited` flag in the
title and description `onChange` handlers and clear it whenever a generation
succeeds. In the success branch, before calling `setListing`, store the current
draft as `previousDraft` if one exists. Clear `previousDraft` in `reset()`.

### Step 2: Announce the replacement and offer a restore that swaps

After a replacement, render a `.feedback` block in the draft panel near the
stale notice. It names the replaced marketplace and says whether that draft had
edits. It contains a `.text-button` labelled "Restore previous draft". Clicking
it swaps the current and previous drafts: listing, marketplace, comps,
revision and edited state. Swapping keeps both drafts reachable. Disable the
button while `loading`. Replace the static copy at lines 621 and 822 so it says
the earlier draft can be restored.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Tests

In `test/generator-page.test.tsx`, mock `browser-image-compression` with
`vi.mock` so the default export returns its input and `getDataUrlFromFile`
returns a synthetic JPEG data URL. Stub `fetch` with `vi.stubGlobal` so it
returns fixture listings, stub `window.matchMedia`, then cover these cases:

1. Edit the title of an eBay draft, then generate an Etsy draft. The Etsy draft
   is shown, the replacement notice appears, and restoring brings back the eBay
   heading with the _edited_ title. Restoring again returns to the Etsy draft.
2. "New item" removes the restore option.

**Verify**: `pnpm test --maxWorkers=1` → all pass, including the new tests.

## Done criteria

- [ ] `pnpm test --maxWorkers=1`, `pnpm typecheck`, `pnpm lint` and `pnpm format:check` all exit 0
- [ ] The production build exits 0
- [ ] `grep -n "replaces your edits" app/app/page.tsx` returns no matches
- [ ] Only in-scope files changed, plus `plans/`

## STOP conditions

- The success branch no longer matches the excerpt above.
- jsdom cannot render the studio with the mocks (for example, `next/image` fails). Report it; do not add a new test dependency.

## Implementation record (2026-11-11, branch `improve/restore-replaced-draft`)

Shipped as planned, with three documented deviations:

1. **Photo preparation is injected through a context.** The repo's lint forbids `vi.mock` (`anti-slop(no-module-mocking)`), and a Next page file cannot take props or export extra symbols. So the compression call moved unchanged into `app/components/photo-preparation.ts`, as `compressPhoto`. A `PhotoPreparation` context defaults to it, and the jsdom test supplies a synthetic data URL through that context. Production behaviour is the same.
2. **A marketplace change no longer bumps `revision`.** Staleness is now `revision !== draftRevision || marketplace !== listingFor`. Without this, every restored draft from another marketplace would show "Your source changed", because the revision counter only increases. Restore also selects the restored draft's marketplace, so "Generate a new draft" targets the draft being viewed. Photo and detail changes still bump `revision`.
3. **Added one step to the e2e journey.** After the successful retry, "Restore previous draft" brings back the edited title. Nothing existing was weakened.

Mutation check: with the "keep the replaced draft" step disabled, both new jsdom tests fail.

## Maintenance notes

- When ROADMAP item 1 (saved drafts) lands, `previousDraft` should become an entry in the saved library rather than a second in-memory slot.
- Any new editable field must also set the `edited` flag.
