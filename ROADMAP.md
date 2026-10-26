# Feature roadmap

Planning baseline: `6c5373e21edf` on `origin/main`, 2026-10-26. This is a proposed product sequence; paid demand and time savings have not been measured.

## Outcome

Let a reseller finish and reuse an accurate listing draft with less repetitive editing. The [current beta](README.md) generates marketplace-specific text from photos, supports copy actions and optional asking-price comparisons, and does not retain listing history or publish listings.

## 1. Save and resume a reviewed draft

Offer opt-in storage of edited listing text on the current device. Let a seller name the item, mark which details they verified, reopen it and delete it. Explain the device-only boundary before saving; do not retain source photos by default.

Acceptance:

- A reload preserves the seller's edits, selected marketplace and verification state.
- Regeneration cannot silently replace manual changes.
- Quota or storage errors leave the existing draft available.
- Copy uses the edited content and respects the selected marketplace's field limits.
- Deleting a saved draft removes it from the device library.

Observe five real draft workflows with consent. Compare time to a seller-approved draft, corrections and reuse against the current copy-only flow. Do not record photos or listing contents in analytics.

## 2. Adapt one item to another marketplace

Reuse verified item facts while generating a separate marketplace variant. Show which fields changed and preserve each version independently.

Acceptance: switching marketplace never changes the underlying confirmed condition or measurements silently; inferred facts remain suggestions.

## 3. Process a small batch deliberately

Add an item queue with per-item progress and retries only after saved drafts prove useful. Before expanding paid model use, enforce a server-owned spending allowance and a clear identity/renewal policy; the existing anonymous cookie is advisory.

## Boundaries

Defer marketplace publishing, payment plans and inventory integrations until repeat use establishes demand. Asking-price comparisons are not completed-sale valuations or guaranteed prices. Seller review remains required for condition, authenticity and marketplace rules. Use the existing generation contract, native storage/library capabilities and test runner; avoid a new orchestration service for this first release.
