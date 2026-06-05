**Status:** done

## Goal

A single-glance "are you on track this cycle?" indicator. Derived from `(remaining_idr, days_left, baseline_uncovered_idr)`. Reusable on the dashboard now and on per-category budget rows later.

## Acceptance criteria

- [x] `src/features/dashboard/components/budget-health-indicator.tsx` exports `<BudgetHealthIndicator summary />` accepting the output of `getMonthlySummary` (or a compatible subset).
- [x] Pure derivation function `computeHealth(...)` lives in `src/features/dashboard/lib/health.ts` (split from the component file so `react-refresh/only-export-components` stays happy) and returns `'on-track' | 'watch' | 'over'`.
  - `'over'` when `remaining < 0` or `remaining < baseline_uncovered`.
  - `'watch'` when daily-burn-rate × days_left > remaining.
  - `'on-track'` otherwise.
- [x] Renders a shadcn `Badge` with status-appropriate color (emerald / amber / destructive) and a one-sentence explanation underneath.
- [x] No async work in the component — it's pure presentation over the prop.

## Notes

- Signature extended to `computeHealth({ remaining, days_left, baseline_uncovered, spent?, days_elapsed? })`. The 'watch' rule needs a burn rate (`spent / days_elapsed`), which the three originally-listed inputs alone can't produce. Callers that don't have a burn rate (per-category budget rows in a later task) can omit `spent`/`days_elapsed` and still get the 'over' / 'on-track' decision.
- The component derives `days_elapsed` from `getCycleLengthDays(cycle) − days_left` so callers only need to pass the summary.
- Badge uses `variant='outline'` with a tinted background utility class rather than introducing new `Badge` variants — keeps the shared component untouched.
