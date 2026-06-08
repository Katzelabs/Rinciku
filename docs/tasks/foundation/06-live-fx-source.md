**Status:** not-started

## Goal

Replace the hardcoded `RATES_TO_IDR` table in `src/lib/fx.ts` (introduced by `05-base-currency-and-cleanup.md`) with a live FX source and a caching strategy that keeps requests cheap and offline-resilient. Becomes load-bearing once real users start switching base currency mid-life or when shipping to production — until then, the stub rates are fine for dev.

This is a **follow-up**, not a blocker for the multi-currency refactor. Land it on its own timeline.

## Acceptance criteria

- [ ] Pick an FX source (e.g. `exchangerate.host`, `openexchangerates.org`, or Frankfurter). Free tier covers all 16 allow-list codes against an IDR base. Capture the choice + reason in this file's notes.
- [ ] Decide where the request happens: a Supabase Edge Function (key not exposed to the browser) or a public-key endpoint that's safe to call from `src/lib/fx.ts`. Default to Edge Function if the chosen source requires a key.
- [ ] Cache strategy: persist the latest rate map in `localStorage` (or a Supabase table if cross-device freshness matters), keyed by date. TTL = 24h is fine for personal finance — FX intraday movement is below the noise floor for budgeting.
- [ ] `src/lib/fx.ts`: `RATES_TO_IDR` becomes a `Promise<Record<CurrencyCode, number>>` (or a sync read from cache + a background refresh). `convertToBase` stays the same shape externally; internal implementation now awaits the rate map.
- [ ] Graceful degradation: if the network is down and there's no cached snapshot, fall back to the hardcoded stub and surface a small "rates may be outdated" UI banner.
- [ ] Pass the live rate map into the dashboard SQL function (`get_month_summary` or whatever it's renamed to) so mixed-history aggregation uses real rates.

## Notes

(append-only)

- The dashboard function already takes `p_rates jsonb` as an arg (see `foundation/05`), so the SQL side needs no change — only the caller swaps the stub for the live map.
- Free-tier rate limits on the candidate sources: validate before picking. Personal-use scale means we can usually share one fetch per day per user.
- Out-of-scope: historical FX rates (would let us re-display old data in the original rate at write time rather than current rate). v2 if ever.
