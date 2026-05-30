**Status:** not-started

## Goal

Aggregation queries the dashboard cards and charts read from. Lives in `src/features/dashboard/api.ts` to keep page components dumb.

References: `docs/schema.md` §3 `profiles` (cycle_start_day), §5 `essentials`, §6 `expenses`.

## Acceptance criteria

- [ ] `getCurrentCycle(profile)` — pure helper returning `{ start: Date, end: Date }` for the user's current monthly cycle from `profiles.cycle_start_day`. Lives in `src/lib/cycle.ts` if other features need it; otherwise scoped to this file.
- [ ] `getMonthlySummary()` — returns `{ income_idr_total, spent_idr_total, remaining_idr, days_left, baseline_idr, baseline_uncovered_idr, by_tier: { fixed, needs, wants } }`.
- [ ] `income_idr_total` derived from `profiles` (`income_idr + income_usd * fx_rate`).
- [ ] `spent_idr_total` and `by_tier` aggregated from `expenses.amount_idr` over the current cycle, grouped by joined `categories.tier`.
- [ ] Reuses `computeBaseline` from `essentials/04-monthly-baseline-summary.md` for the baseline numbers.
- [ ] Single Supabase round-trip per source table where possible; do not loop over rows in JS for sums.
- [ ] Returns `{ data, error }` shape consistent with other feature APIs.

## Notes
