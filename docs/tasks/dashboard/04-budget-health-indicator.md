**Status:** not-started

## Goal

A single-glance "are you on track this cycle?" indicator. Derived from `(remaining_idr, days_left, baseline_uncovered_idr)`. Reusable on the dashboard now and on per-category budget rows later.

## Acceptance criteria

- [ ] `src/features/dashboard/components/budget-health-indicator.tsx` exports `<BudgetHealthIndicator summary />` accepting the output of `getMonthlySummary` (or a compatible subset).
- [ ] Pure derivation function `computeHealth({ remaining, days_left, baseline_uncovered }): 'on-track' | 'watch' | 'over'` — exported separately so other surfaces can reuse the rule.
  - `'over'` when `remaining < 0` or `remaining < baseline_uncovered`.
  - `'watch'` when daily-burn-rate × days_left > remaining.
  - `'on-track'` otherwise.
- [ ] Renders a shadcn `Badge` with tier-appropriate color (green / amber / red) and a one-sentence explanation underneath.
- [ ] No async work in the component — it's pure presentation over the prop.

## Notes
