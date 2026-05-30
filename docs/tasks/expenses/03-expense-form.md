**Status:** not-started

## Goal

Manual-entry form for a single expense, used by the list page (add + edit).

## Acceptance criteria

- [ ] Zod schema `expenseSchema` in `src/features/expenses/schemas.ts`: `amount` (> 0), `currency` (`'IDR' | 'USD'`), `category_id` (uuid), `occurred_at` (date, ≤ today), `note` (optional string).
- [ ] `src/features/expenses/components/expense-form.tsx` exposes `<ExpenseForm mode defaultValues onSuccess />`.
- [ ] Built via the `new-form` skill.
- [ ] Before submit, call `convertToIdr(...)` from `src/lib/fx.ts` and pass `fx_rate_to_idr` + `amount_idr` into `createExpense`. Set `source: 'manual'`.
- [ ] Category select grouped by tier (Fixed / Needs / Wants headers) — easier to scan when there are many categories.
- [ ] Date field defaults to today; uses shadcn `Calendar` inside a `Popover`.
- [ ] Surfaces errors via toast; calls `onSuccess` on success.

## Notes
