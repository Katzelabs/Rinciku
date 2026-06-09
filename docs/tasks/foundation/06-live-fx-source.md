**Status:** done

## Goal

Replace the hardcoded `RATES_TO_IDR` table in `src/lib/fx.ts` (introduced by `05-base-currency-and-cleanup.md`) with a live FX source and a caching strategy that keeps requests cheap and offline-resilient. Becomes load-bearing once real users start switching base currency mid-life or when shipping to production — until then, the stub rates are fine for dev.

This is a **follow-up**, not a blocker for the multi-currency refactor. Land it on its own timeline.

## Acceptance criteria

- [x] Pick an FX source (e.g. `exchangerate.host`, `openexchangerates.org`, or Frankfurter). Free tier covers all 16 allow-list codes against an IDR base. Capture the choice + reason in this file's notes.
- [x] Decide where the request happens: a Supabase Edge Function (key not exposed to the browser) or a public-key endpoint that's safe to call from `src/lib/fx.ts`. Default to Edge Function if the chosen source requires a key.
- [x] Cache strategy: persist the latest rate map in `localStorage` (or a Supabase table if cross-device freshness matters), keyed by date. TTL = 24h is fine for personal finance — FX intraday movement is below the noise floor for budgeting.
- [x] `src/lib/fx.ts`: `RATES_TO_IDR` becomes a `Promise<Record<CurrencyCode, number>>` (or a sync read from cache + a background refresh). `convertToBase` stays the same shape externally; internal implementation now awaits the rate map.
- [x] Graceful degradation: if the network is down and there's no cached snapshot, fall back to the hardcoded stub and surface a small "rates may be outdated" UI banner.
- [x] Pass the live rate map into the dashboard SQL function (`get_month_summary` or whatever it's renamed to) so mixed-history aggregation uses real rates.

## Notes

(append-only)

- The dashboard function already takes `p_rates jsonb` as an arg (see `foundation/05`), so the SQL side needs no change — only the caller swaps the stub for the live map.
- Free-tier rate limits on the candidate sources: validate before picking. Personal-use scale means we can usually share one fetch per day per user.
- Out-of-scope: historical FX rates (would let us re-display old data in the original rate at write time rather than current rate). v2 if ever.
- 2026-06-09 — implementation decisions:
  - **Source: `open.er-api.com`** (the "open access" tier of exchangerate-api.com). Endpoint `GET https://open.er-api.com/v6/latest/IDR`. No API key, CORS-enabled, daily updates, covers all 16 codes including VND.
  - Why not the three brief candidates: `exchangerate.host` now requires a key (APILayer); `openexchangerates.org` free tier is USD-base-only + key-required (inversion adds rounding error); Frankfurter is ECB-sourced and does not publish VND.
  - **Where: browser-direct call from `src/lib/fx.ts`.** No Edge Function. The source is keyless, CORS-safe, and personal-finance scale fits comfortably in its open tier. Revisit if we ever switch to a keyed source.
  - **Cache shape**: `localStorage` key `rinciku.fx.v1` storing `{ rates: RateMap, fetched_at: ISO, source_unix: number }`. TTL 24h on `fetched_at`. Versioned key lets us nuke stale schemas later by bumping to `v2`.
  - **Sync `convertToBase`, async `ensureRates`** — went with the "sync read + background refresh" branch from the brief because `convertToBase` is called from render paths (`expenses.tsx`, `incomes.tsx`, `essentials/baseline.ts`); making it async would have forced an effect + state in every table row. Dashboard `getMonthlySummary` awaits `ensureRates()` once before the RPC so `p_rates` reflects whatever the cache+live walk produced.
  - **Boot**: a tiny `FxBootstrapper` inside `Providers` fires `ensureRates()` once on mount and surfaces a single `sonner` toast when the fallback to the stub happens in a session.
  - **Banner**: `src/components/shared/fx-banner.tsx` renders only at the top of the dashboard page when `status.source !== 'live'` or `status.stale === true`. Includes a Retry button that calls `ensureRates({ force: true })`.
  - The shape of `getCurrentRates()` is unchanged (`Record<CurrencyCode, number>`) so the dashboard SQL function's `p_rates` contract is untouched.
