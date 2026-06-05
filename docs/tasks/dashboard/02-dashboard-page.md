**Status:** done

## Goal

`/` (or `/dashboard`) route — the first thing a signed-in, onboarded user sees. Cards for income, spent, remaining, days left in cycle; plus the tier breakdown and budget-health indicator from the sibling tasks.

## Acceptance criteria

- [x] `src/features/dashboard/pages/dashboard.tsx` renders a responsive grid (1 col mobile, 2 col tablet, 4 col desktop) of summary cards from `getMonthlySummary()`.
- [x] Cards: "Income (this cycle)", "Spent so far", "Remaining", "Days left".
- [x] Below the cards: a two-column section with `<NeedsVsWantsBreakdown />` and `<BudgetHealthIndicator />`.
- [x] At the very top of the page: a one-line cycle label ("Cycle: 1–30 May") computed from `getCurrentCycle`.
- [x] Route added to `src/features/dashboard/routes.tsx` at path `/` (index route under the authenticated shell). Wrapped per the guard convention.
- [x] Loading: `Skeleton` cards. Error: a single retry banner — don't render half-loaded cards.

## Notes

- Index route + `protectedRoute(<DashboardPage/>)` wrapping already existed in `routes.tsx`; no router changes needed.
- Profile comes from `useAuth()`. Page renders the skeleton until both `profile` and the summary are in hand, so cards never appear half-populated.
- Loading is derived from `response.key !== fetchKey` (same pattern as `essentials.tsx`) to avoid `setState` inside the effect — the lint rule `react-hooks/set-state-in-effect` flags the more obvious "reset to loading" approach.
- "Remaining" card flips to `text-destructive` when negative, so an over-cycle state is visible without scrolling to the health indicator.
