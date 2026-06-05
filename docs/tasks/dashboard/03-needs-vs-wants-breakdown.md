**Status:** done

## Goal

Visual tier breakdown for the current cycle — how much of this month's spend is Fixed vs Needs vs Wants. Used on the dashboard.

## Acceptance criteria

- [x] `src/features/dashboard/components/needs-vs-wants-breakdown.tsx` exports `<NeedsVsWantsBreakdown />`.
- [x] Renders a horizontal stacked bar (simpler + more legible at small widths than a donut). Three segments with category-tier colors and percentage labels.
- [x] Legend underneath lists each tier with its absolute IDR amount.
- [x] Reads from `getMonthlySummary().by_tier` — does not refetch independently.
- [x] Handles the all-zero case with an empty-state message ("No spending yet this cycle").
- [x] No third-party chart lib unless absolutely needed — a stacked bar is just a flex row with widths.

## Notes

- Tier colors are hard-coded to match `handle_new_user`'s seeded category colors (fixed `#7a8d6a`, needs `#a3a86b`, wants `#c4a86b`). Per-category colors aren't surfaced here since the breakdown is at tier granularity.
- Component takes `by_tier` directly (not the full summary) so the same component can drop into per-period reports later without coupling to `MonthlySummary`.
