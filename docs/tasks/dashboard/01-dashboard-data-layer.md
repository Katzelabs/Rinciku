**Status:** done

## Goal

Aggregation queries the dashboard cards and charts read from. Lives in `src/features/dashboard/api.ts` to keep page components dumb.

References: `docs/schema.md` §3 `profiles` (`month_start_day`), §5 `essentials`, §6 `expenses`.

## Acceptance criteria

- [x] `getCurrentCycle(profile)` — pure helper returning `{ start: Date, end: Date }` for the user's current monthly cycle from `profiles.month_start_day`. Lives in `src/lib/cycle.ts`.
- [x] `getMonthlySummary()` — returns `{ cycle, income_idr_total, spent_idr_total, remaining_idr, days_left, baseline_idr, baseline_uncovered_idr, by_tier: { fixed, needs, wants } }`.
- [x] `income_idr_total` derived from `profiles` (`monthly_income_idr + monthly_income_usd * fx_rate`).
- [x] `spent_idr_total` and `by_tier` aggregated from `expenses.amount_idr` over the current cycle, grouped by joined `categories.tier`.
- [x] Reuses `computeBaseline` from `essentials/04-monthly-baseline-summary.md` for the baseline numbers.
- [x] Single Supabase round-trip per source table.
- [x] Returns `{ data, error }` shape consistent with other feature APIs.

## Notes

- Schema column is `month_start_day`, not `cycle_start_day`; income columns are `monthly_income_idr` / `monthly_income_usd`. Acceptance criteria updated to match.
- `baseline_uncovered_idr = max(0, baseline_idr − (spent_fixed + spent_needs))` — the share of essentials still owed this cycle (consumed by `BudgetHealthIndicator`'s "over" rule).
- Expense sums are computed in Postgres via the `dashboard_monthly_summary(start_at, end_at)` RPC (`supabase/schemas/80_dashboard_functions.sql`). Uses `sum() filter (where c.tier = ...)` to produce per-tier totals + grand total in one row. RLS-aware via `auth.uid()`; `security invoker` + `set search_path = ''`.
- Cycle bounds: `getCurrentCycle` returns an inclusive `end` (`nextStart − 1ms`); the RPC window is half-open `[start, end)`, so the api passes `nextStart` (`cycle.end + 1ms`) as `end_at`.
- FX comes from `getFxRate('USD','IDR')` in `@/lib/fx`. Profiles have no FX column — the rate is a process-wide constant until the live-rate task lands.
