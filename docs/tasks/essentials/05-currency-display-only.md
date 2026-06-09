**Status:** done

## Goal

Lock the essentials form's currency field to the user's `base_currency` (read-only display, not a picker) and route the amount display through `formatCurrency`. The DB-side allow-list expansion to 16 codes already happens in `foundation/05-base-currency-and-cleanup.md`; this task is the UI-side complement.

If the change is folded into `foundation/05`'s diff, this task can be closed from there.

## Acceptance criteria

- [x] Essential form (`src/features/essentials/components/...form.tsx`): currency field renders as a read-only label/chip showing the user's `base_currency`. Remove any IDR/USD picker.
- [x] On submit, the saved row's `currency` equals the user's current `base_currency` (sourced from `useAuth` profile).
- [x] Essentials list / monthly-baseline summary: amount displayed via `formatCurrency(amount, currency)` from `src/lib/format.ts`.
- [x] Per-currency decimal handling on the amount input: `step=1` for zero-decimal currencies (JPY/KRW/VND), `step=0.01` otherwise.
- [x] `pnpm build` passes.
- [x] Manual: log in, add an essential — currency shown is current base, amount accepts/rejects decimals per currency, saved row's `currency` matches.

## Notes

(append-only)

- Essentials' `currency` column already exists and the data shape doesn't change beyond the check-constraint expansion in `foundation/05`. The work here is purely UI.
- Monthly baseline summary aggregation: if it currently sums `amount` blindly, switch to the dashboard SQL function that does runtime FX conversion. Mixed currencies arise only after a base-currency change, but the math should be right either way.
- The list / baseline-summary display through `formatCurrency` was already in place from `foundation/05`. The actual work delivered here was:
  - `essential-form.tsx`: dropped the currency `<Select>` picker; the `InputGroupAddon` chip is now the only display of the currency. On create the form initialises `currency = profile.base_currency`; on edit it preserves the row's stored `currency`. Amount input `step` is now driven by `stepForCurrency(currency)` from `src/lib/format.ts` (`1` for JPY/KRW/VND, `0.01` otherwise).
- Baseline aggregation kept client-side: `src/features/essentials/lib/baseline.ts::computeBaseline` already does per-row `convertToBase` before summing, so the "don't sum blindly" intent is satisfied. No essentials-side SQL function was added (the dashboard RPC covers expenses only).
