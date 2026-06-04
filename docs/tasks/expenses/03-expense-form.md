**Status:** in-progress

## Goal

Manual-entry form for a single expense, used by the list page (add + edit).

## Acceptance criteria

- [x] Zod schema `expenseSchema` in `src/features/expenses/schemas.ts`: `amount` (> 0), `currency` (`'IDR' | 'USD'`), `category_id` (uuid), `occurred_at` (date, ≤ today), `note` (optional string).
- [x] `src/features/expenses/components/expense-form.tsx` exposes `<ExpenseForm mode defaultValues onSuccess />`.
- [x] Built via the `new-form` skill.
- [x] Before submit, call `convertToIdr(...)` from `src/lib/fx.ts` and pass `exchange_rate_to_idr` into `createExpense`. Set `source: 'manual'`. (`amount_idr` is a generated column — not part of the create payload; see Notes.)
- [x] Category select grouped by tier (Fixed / Needs / Wants headers) — easier to scan when there are many categories.
- [x] Date field defaults to today; uses shadcn `Calendar` inside a `Popover`.
- [x] Surfaces errors via toast; calls `onSuccess` on success.

## Notes

- **Naming drift vs. spec:** the original criteria mentioned `fx_rate_to_idr` and `amount_idr` as inputs to `createExpense`. The actual schema (`supabase/schemas/13_expenses.sql:12`) defines `amount_idr` as a generated column: `numeric(15,2) generated always as (round(amount * exchange_rate_to_idr, 2)) stored`, and the api in `src/features/expenses/api.ts` accordingly takes `exchange_rate_to_idr` only. The form passes that one field; the DB computes `amount_idr`.
- **Categories slice landed here:** added `listCategories()` to `src/features/categories/api.ts` plus a `useCategories` hook + `groupByTier` helper at `src/features/categories/hooks/use-categories.ts` to back the grouped Select. Rest of the categories CRUD still belongs to that feature's task 01.
- **Form-pattern deviation:** the project does not use shadcn's `Form` primitive (there is no `components/ui/form.tsx`). The form is built on the existing `Field` / `FieldGroup` / `InputGroup` + `Controller` pattern from `src/features/auth/components/sign-in-form.tsx` and `profile-form.tsx`, which is what the `new-form` skill resolves to in this codebase.
- **`<ExpenseForm />` is self-submitting** (props are `mode`, `defaultValues`, `onSuccess`), so it does the FX conversion + `createExpense`/`updateExpense` internally and toasts on result. This deviates from the `new-form` skill's "submit is a prop" guidance but matches the task signature.
- **Zod v4 + RHF amount field:** schema uses `z.number().refine(notNaN).positive()` and the input uses `register('amount', { valueAsNumber: true })`. `z.coerce.number()` was tried first but its `z.input` type is `unknown`, which mismatches RHF's resolver typing.
- **Calendar patch:** the shadcn-generated `src/components/ui/calendar.tsx` shipped with a `table: "w-full border-collapse"` className that is not in `react-day-picker@10` `ClassNames` type (v10 dropped the `<table>` layout). The line was deleted; no visual impact.
- **Temporary verification harness:** `src/features/expenses/pages/expenses.tsx` currently mounts `<ExpenseForm mode='create' onSuccess={() => {}} />` directly so the route is usable for end-to-end smoke testing. Tagged with a `TODO(task-04)` comment to be replaced when the list page + dialog wrappers land.
