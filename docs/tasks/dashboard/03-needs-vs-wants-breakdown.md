**Status:** not-started

## Goal

Visual tier breakdown for the current cycle — how much of this month's spend is Fixed vs Needs vs Wants. Used on the dashboard.

## Acceptance criteria

- [ ] `src/features/dashboard/components/needs-vs-wants-breakdown.tsx` exports `<NeedsVsWantsBreakdown />`.
- [ ] Renders a horizontal stacked bar (simpler + more legible at small widths than a donut). Three segments with category-tier colors and percentage labels.
- [ ] Legend underneath lists each tier with its absolute IDR amount.
- [ ] Reads from `getMonthlySummary().by_tier` — does not refetch independently.
- [ ] Handles the all-zero case with an empty-state message ("No spending yet this cycle").
- [ ] No third-party chart lib unless absolutely needed — a stacked bar is just a flex row with widths.

## Notes
