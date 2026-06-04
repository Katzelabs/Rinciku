**Status:** done

## Goal

Populate `src/features/expenses/api.ts` with typed Supabase queries/mutations for the `expenses` table. Per-row FX rate is stored inline at log time (no rates table) — see `docs/schema.md` §6.

## Acceptance criteria

- [x] `listExpenses({ from, to, categoryId? })` — returns rows in the date range, joined with `category:categories(*)` and `attachment:expense_attachments(*)`. Ordered by `occurred_at desc`.
- [x] `createExpense(input)` — input: amount, currency, category_id, occurred_at, note, source (`'manual' | 'chat' | 'image'`), fx_rate_to_idr, amount_idr. Caller supplies the FX-snapshotted values from the helper in `02-fx-conversion-helper.md`.
- [x] `updateExpense(id, patch)`.
- [x] `deleteExpense(id)` — does not cascade-delete attachments (per schema §7); attachments are nullable parent. Surface a confirmation in the UI layer if an attachment is linked.
- [x] `getExpense(id)` — used by edit form.
- [x] All return `{ data, error }`; surface `PostgrestError`.
- [x] Built via the `new-api` skill.

## Notes

- 2026-06-03 — Implemented. Five exports: `listExpenses`, `getExpense`, `createExpense`, `updateExpense`, `deleteExpense`. Joined select uses the alias form `*, category:categories(*), attachment:expense_attachments(*)` and is typed as `ExpenseWithRelations` via `.returns<...>()`.
- 2026-06-03 — Deviations from this task spec, worth noting for `02-fx-conversion-helper.md` and the form/action work that follows:
  - **`amount_idr` dropped from `CreateExpenseInput`.** The schema (`supabase/schemas/13_expenses.sql`) declares `amount_idr` as `generated always as (round(amount * exchange_rate_to_idr, 2)) stored`, so the DB rejects user-supplied values. Callers pass only `exchange_rate_to_idr`; the FX helper from `02` is still needed to compute the display total before submit, but the value isn't sent to the DB.
  - **`user_id` added to `CreateExpenseInput`.** RLS requires `user_id = auth.uid()` on insert and there is no `default auth.uid()` on the column. Callers supply `user.id` explicitly (same pattern as `auth/upsertProfile`).
  - **Field name is `exchange_rate_to_idr`, not `fx_rate_to_idr`** (matches the DB column).
- 2026-06-03 — `pnpm build` and `pnpm lint` both clean.
