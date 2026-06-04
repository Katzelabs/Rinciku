**Status:** done

## Goal

A reusable, IDR-normalized summary of monthly essentials — used in the essentials page footer and the dashboard. Encapsulates the FX conversion so callers don't redo it.

## Acceptance criteria

- [ ] `src/features/essentials/components/monthly-baseline-summary.tsx` exports `<MonthlyBaselineSummary variant="footer" | "card" />`.
- [ ] Internally computes `{ total_idr, by_tier: { fixed, needs, wants } }` from `listEssentials()` and the FX helper from `expenses/02-fx-conversion-helper.md`.
- [ ] Also exports a pure function `computeBaseline(essentials, fxRate)` so the dashboard data layer can reuse it without rendering the component.
- [ ] `variant="footer"` renders a single right-aligned line ("Monthly baseline: Rp X"); `variant="card"` renders a shadcn `Card` with the per-tier breakdown.
- [ ] Loading and error states present.

## Notes

- `computeBaseline` lives in `src/features/essentials/lib/baseline.ts` (not co-located with the component) because `react-refresh/only-export-components` flags non-component exports from component files. Import from `@/features/essentials/lib/baseline` (or via the component for convenience).
- Self-fetches via `listEssentials()` + `getFxRate('USD','IDR')`. Pass `refreshKey={n}` to force a refetch after mutations (see `pages/essentials.tsx`).
- `is_active = false` rows are excluded from the baseline.
