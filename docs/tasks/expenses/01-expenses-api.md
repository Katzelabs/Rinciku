**Status:** not-started

## Goal

Populate `src/features/expenses/api.ts` with typed Supabase queries/mutations for the `expenses` table. Per-row FX rate is stored inline at log time (no rates table) — see `docs/schema.md` §6.

## Acceptance criteria

- [ ] `listExpenses({ from, to, categoryId? })` — returns rows in the date range, joined with `category:categories(*)` and `attachment:expense_attachments(*)`. Ordered by `occurred_at desc`.
- [ ] `createExpense(input)` — input: amount, currency, category_id, occurred_at, note, source (`'manual' | 'chat' | 'image'`), fx_rate_to_idr, amount_idr. Caller supplies the FX-snapshotted values from the helper in `02-fx-conversion-helper.md`.
- [ ] `updateExpense(id, patch)`.
- [ ] `deleteExpense(id)` — does not cascade-delete attachments (per schema §7); attachments are nullable parent. Surface a confirmation in the UI layer if an attachment is linked.
- [ ] `getExpense(id)` — used by edit form.
- [ ] All return `{ data, error }`; surface `PostgrestError`.
- [ ] Built via the `new-api` skill.

## Notes
