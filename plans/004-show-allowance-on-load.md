# Plan 004: The studio shows the real remaining allowance on first load

> **Executor instructions**: Follow this plan step by step and run every
> verification. Stop and report on any STOP condition. When done, update this
> plan's row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5960b80..HEAD -- app/app/page.tsx app/api/generate/route.ts`

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED (changes the route and page boundary for `/app`)
- **Depends on**: 001
- **Category**: direction / UX correctness
- **Planned at**: commit `5960b80`, 2026-11-11

## Why this matters

`remaining` starts as `null` (`app/app/page.tsx:51`). The header always says
"10 free generations / session" (`page.tsx:387-389`), even when the cookie
shows the allowance is spent. A returning seller with 0 left can upload
photos, fill in details and press Generate before learning, from a 429, that
nothing is left. `PRODUCT.md` says to "state … quota limitations plainly."

## Current state

- `app/api/generate/route.ts:30-33` parses `sh_session` and `sh_used_<sid>` into a safe integer `used`. That parsing is the only copy of the logic.
- `app/app/page.tsx` is a `"use client"` default export, so it has no server-side cookie access.

## Scope

**In scope**:

- A new `lib/allowance.ts`, which holds the extracted cookie parsing, `FREE_LIMIT`, and a `remaining(cookies)` helper.
- `app/api/generate/route.ts`, changed to use it.
- `app/app/page.tsx`: move the client component to `app/app/studio.tsx` and make `page.tsx` a server component. The server component awaits `cookies()` and passes `initialRemaining`.
- Tests.

**Out of scope**: making the allowance enforceable. It stays advisory, as `README.md` documents.

## Steps

1. Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` first. In Next 16, `cookies()` is async.
2. Extract the parsing into `lib/allowance.ts` and change the route to use it. The existing malformed-cookie tests must still pass unchanged.
3. Split `/app` into a server page plus a client studio that seeds `remaining` from the `initialRemaining` prop. Reading cookies makes the page dynamic; confirm in the build output that `/app` shows as dynamic (`ƒ`).
4. Add a test: `remaining()` returns 10 when there is no cookie, 0 at the limit, and 10 when the count is malformed.

**Verify**: tests, typecheck, lint and build all pass.

## STOP conditions

- The cookie-name scheme (`sh_used_<sid>`) has changed.
- Making `/app` dynamic is unacceptable for hosting cost. Ask the maintainer.
