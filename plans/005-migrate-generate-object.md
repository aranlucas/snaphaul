# Plan 005: Replace the deprecated `generateObject` call

> **Executor instructions**: Follow this plan step by step and run every
> verification. Stop and report on any STOP condition. When done, update this
> plan's row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5960b80..HEAD -- app/api/generate/route.ts`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (the offline HTTP-adapter route test covers the wire format)
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `5960b80`, 2026-11-11

## Why this matters

`pnpm test` prints `[AISDK_DEP_GENERATE_OBJECT] DeprecationWarning: … "generateObject". Use generateText with an output setting instead.`
The warning comes from `app/api/generate/route.ts:51` (`ai@^7`). Deprecated
APIs get removed in the next major version, and this call is the core
generation path. The production logs also fill with the warning on every
request.

## Current state

- `app/api/generate/route.ts:51-72`: `generateObject({ model, schema: ListingSchema, system, messages, temperature, maxOutputTokens, maxRetries: 0, abortSignal })` returns `result.object`.
- `test/generate-listing.test.ts` ("the route counts one successful generated listing using an offline HTTP adapter") drives the real SDK with a mocked `fetch`.

## Steps

1. Change the call to `generateText({ ..., output: Output.object({ schema: ListingSchema }) })` and return `result.output`. `Output` is exported from `ai`; check `node_modules/ai/dist/index.d.ts` for `output_d_exports`. Keep every other option, including `abortSignal` and `maxRetries: 0`.
2. Check whether the AI SDK now prefers `instructions` over `system` (`index.d.ts:866` marks something as `@deprecated Use instructions`). Use whichever option is not deprecated for `generateText`.

**Verify**: `pnpm test --maxWorkers=1 2>&1 | grep -c AISDK_DEP_GENERATE_OBJECT` prints `0`, and all tests pass, including the malformed-cookie and stalled-model regressions. Typecheck and lint exit 0.

## STOP conditions

- The offline route test fails because the response format changed (for example, tool-call mode instead of a JSON response format). Report it rather than rewriting the fixture.
