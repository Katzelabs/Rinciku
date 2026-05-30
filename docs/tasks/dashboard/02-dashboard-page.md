**Status:** not-started

## Goal

`/` (or `/dashboard`) route — the first thing a signed-in, onboarded user sees. Cards for income, spent, remaining, days left in cycle; plus the tier breakdown and budget-health indicator from the sibling tasks.

## Acceptance criteria

- [ ] `src/features/dashboard/pages/dashboard.tsx` renders a responsive grid (1 col mobile, 2 col tablet, 4 col desktop) of summary cards from `getMonthlySummary()`.
- [ ] Cards: "Income (this cycle)", "Spent so far", "Remaining", "Days left".
- [ ] Below the cards: a two-column section with `<NeedsVsWantsBreakdown />` and `<BudgetHealthIndicator />`.
- [ ] At the very top of the page: a one-line cycle label ("Cycle: 1–30 May") computed from `getCurrentCycle`.
- [ ] Route added to `src/features/dashboard/routes.tsx` at path `/` (index route under the authenticated shell). Wrapped per the guard convention.
- [ ] Loading: `Skeleton` cards. Error: a single retry banner — don't render half-loaded cards.

## Notes
