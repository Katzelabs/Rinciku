---
name: verify
description: Runtime-verify Rinciku web changes by driving the real app with Playwright against the local Supabase stack. Use after nontrivial changes to apps/web or packages/domain.
---

# Verify (Rinciku web)

## Handle

- Local Supabase must be up (`supabase status`); DB at
  `postgresql://postgres:postgres@127.0.0.1:54322/postgres`, API `:54321`.
  Edge functions (ai-chat) run in the `supabase_edge_runtime_rinciku`
  container with secrets from `supabase/functions/.env` — no extra serve step.
- Web dev server: `pnpm --filter @rinciku/web dev` (background) — port is
  printed (`5173`/`5174`).
- Demo login (seeded on every `db reset`): `demo@rinciku.app` / `Password123`.
  Demo user id: `00000000-0000-0000-0000-0000000000d0`.
- Browser driving: Playwright via `/Users/zidanhafiz/tools/Webwright/.venv/bin/python`
  (Firefox; run `.../bin/playwright install firefox` if executables are stale).
  Claude-in-Chrome may not be connected — Playwright is the reliable path.

## Drive

- Seed scale/test data directly with psql against the local DB (immutable
  append-only messages make this safe); delete the seeded rows by title
  pattern afterwards.
- Capture Supabase traffic with `page.on('request')` filtered to `54321` —
  PostgREST pagination shows up as `limit=`/`offset=`/`or=` query params;
  the LLM proxy is `functions/v1/ai-chat` (POST body = system+messages).
- Login flow: `/sign-in`, fill Email/Password textboxes by role, click
  "Sign in", wait for URL to leave `/sign-in`.

## Gotchas

- The chat thread auto-follows with `behavior: 'smooth'`. A programmatic
  `scrollTop = 0` while that animation is running gets cancelled — poll
  `scrollTop` until stable, then `scrollTo({top: 0, behavior: 'instant'})`.
- Virtual rows (`[data-index]`) are in mount order, not index order — sort
  before reasoning about "first visible".
- `conversations` GETs are ambiguous: list fetches embed `messages(...)`;
  per-row summary reads select `summary` — filter before counting refetches.
