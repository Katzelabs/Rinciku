**Status:** done

## Goal

Ripple the schema rename from `foundation/05-base-currency-and-cleanup.md` through the expenses feature: drop every `amount_idr` / `exchange_rate_to_idr` reference, lock the currency input to the user's `base_currency`, and route totals/display through `formatCurrency`.

If the rename is folded into the `foundation/05` execution diff, this task can be marked `done` from there — but it stays here so the touched files are explicitly tracked.

## Acceptance criteria

- [x] `src/features/expenses/api.ts`: remove `exchange_rate_to_idr` (line ~38) from the select shape and any create/update payloads. Remove `amount_idr` from select shapes.
- [x] `src/features/expenses/components/expense-form.tsx`: drop the `convertToIdr` call (around line 116) and the `exchange_rate_to_idr` insert payload field (~line 129). Submit just `amount + currency` with `currency = profile.base_currency`. Render the currency field as a read-only label/chip, not a picker.
- [x] `src/features/expenses/pages/expenses.tsx`: replace `Number(row.amount_idr ?? 0)` (~line 91) with `Number(row.amount)`. Format display via `formatCurrency(row.amount, row.currency)`. Monthly totals — pull from the dashboard SQL function so mixed-currency history aggregates correctly (don't sum `amount` blindly across rows with different `currency`).
- [x] `src/features/expenses/components/expense-table.tsx`: replace `Number(row.amount_idr)` (~line 71) with `formatCurrency(Number(row.amount), row.currency)`.
- [x] `pnpm build` passes after `database.types.ts` regen.
- [x] Manual: existing expenses list renders without console errors; new expense form submit works end-to-end.

## Notes

(append-only)

- This task touches only the rename ripples in the expenses feature. The attachment upload flow stays as-is (no schema change there beyond what `foundation/05` covers).
- The form's currency UX: render a small inline label like `IDR` next to the amount input — not a `<select>`. The base currency only changes via account settings; we don't want per-transaction overrides.
- The schema-rename ripples (api.ts select shape, expense-form payload, `amount_idr` reads in expenses.tsx/expense-table.tsx) were already folded into the `foundation/05` execution diff. The actual work delivered here was:
  - `expense-form.tsx`: dropped the currency `<Select>` picker; the `InputGroupAddon` chip is now the only display of the currency. On create the form initialises `currency = profile.base_currency`; on edit it preserves the row's stored `currency` so historical rows are not silently rewritten. Amount input `step` is now driven by `stepForCurrency(currency)` (`1` for JPY/KRW/VND, `0.01` otherwise).
  - `expenses.tsx`: replaced the client-side `convertToBase` reduce with a parallel call to the `dashboard_monthly_summary` RPC (`p_rates: RATES_TO_IDR`). The tier-filter total is derived from the RPC's per-tier columns plus an "uncategorized" remainder so it matches the per-row filter behaviour. `convertToBase` is no longer imported here.
  - `src/lib/format.ts`: added `stepForCurrency(code)` helper alongside `formatCurrency` (single source of truth for the JPY/KRW/VND zero-decimal rule).
