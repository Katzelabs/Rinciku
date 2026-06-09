**Status:** done

## Goal

Rewire the dashboard so it surfaces both **income received this cycle** (sum from the new `incomes` table) and **expected monthly income** (from `profiles.expected_monthly_income`), and so its aggregations work correctly when a user has historical rows in a former base currency. Drop the obsolete `monthly_income_idr + monthly_income_usd * fxRate` formula.

Depends on `foundation/05-base-currency-and-cleanup.md` (schema rename + FX layer), `incomes/01-schema.md` (new table), and ideally `incomes/02-api-and-attachments.md` (data layer).

## Acceptance criteria

### Data layer

- [x] `src/features/dashboard/api.ts`: drop `Number(profile.monthly_income_idr ?? 0) + Number(profile.monthly_income_usd ?? 0) * fxRate` (around line 59). Replace with:
  - `expectedMonthlyIncomeBase = convertToBase(profile.expected_monthly_income, profile.expected_monthly_income_currency, profile.base_currency).amount_base`.
  - `incomeReceivedThisCycleBase` from the new dashboard SQL function (takes current `base_currency` + rate map).
- [x] Dashboard SQL function (renamed/updated in `foundation/05`): returns both `spent_total`, `tier_fixed`, `tier_needs`, `tier_wants`, and the new `income_received_this_cycle` — all in the current base currency.
- [x] Pass the current FX rate map (from `src/lib/fx.ts`) as the `p_rates` JSONB arg.

### UI

- [x] Dashboard surfaces two income numbers: **Received this cycle** and **Expected baseline**. Side-by-side, or stacked with small labels — design choice; keep the visual hierarchy honest (received is the actual, expected is the planning hint).
- [x] If `expected_monthly_income = 0` (variable-income user), hide the "Expected baseline" label or show "—" instead of a misleading zero.
- [x] Budget health indicator and tier breakdown unchanged in structure; only the totals computation switches to the runtime-FX function.
- [x] Days-remaining math is untouched.

### Verification

- [x] `pnpm build` passes.
- [ ] Manual: log in, dashboard shows both income numbers. Receive→ log a Rp 5M income via the Incomes page → dashboard "Received" updates on refresh.
- [ ] Manual: change base in settings (USD), refresh dashboard. Historical IDR expenses now display as USD-converted; totals reconcile.
- [ ] Manual: with `expected_monthly_income = 0`, dashboard hides/dashes the baseline label rather than showing "0" awkwardly.

## Notes

(append-only)

- For the "Received" widget, the cycle window is `[profile.month_start_day, profile.month_start_day + 1 month)`. Reuse the existing cycle-window helper if one already lives in `src/features/dashboard/`; don't reinvent.
- AI consultation prompt (future, `ai-chat` slice): same two numbers + spending-so-far + days-remaining feed the system prompt. Capture this in the ai-chat task notes when wiring it up so it doesn't get forgotten.
- Out of scope: visualizing income vs spend on a chart. v2 polish.
- 2026-06-09 — landed. `dashboard_monthly_summary` extended with a `converted_incomes` CTE and a new `income_received_this_cycle` return column (same `amount * (p_rates ->> currency) / (p_rates ->> p_base)` pivot pattern as expenses). Single rolling-init migration regenerated to `20260609141634_init.sql`; `supabase db reset` clean; `supabase gen types --local` produced the new column. `MonthlySummary` renamed `income_total` → `expected_monthly_income` and added sibling `income_received`. `remaining = expected_monthly_income - spent_total` stays unchanged so the budget-health indicator / `health.ts` aren't perturbed — the expected-vs-received split is presentation only. Dashboard "Income" card became "Received this cycle" with the expected baseline as a small muted secondary line that hides entirely when `expected_monthly_income === 0` (variable-income users). `SummaryCard` gained an optional `secondary?: string` prop. No cycle helper was extracted — the data layer already calls `getCurrentCycle(profile)` once and reuses `cycle.start` / `endExclusive` for the RPC. `pnpm build` + `pnpm lint` green. Manual smoke deferred to merge time.
