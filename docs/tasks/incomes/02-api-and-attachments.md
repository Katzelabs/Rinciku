**Status:** not-started

## Goal

Build `src/features/incomes/api.ts` with full CRUD + attachment helpers, mirroring the patterns in `src/features/expenses/api.ts` (around lines 139–193 for the attachment helpers). Returns typed rows from `src/lib/database.types.ts`, surfaces `PostgrestError` to the caller, and keeps business logic out — this is the data layer.

Depends on `incomes/01-schema.md` (tables + bucket must exist and types must be regenerated).

## Acceptance criteria

### CRUD

- [ ] `listIncomes(opts?)` — selects from `incomes`, optionally filtered by date range, ordered by `occurred_at desc`. Returns rows with `attachment` joined when present (left join via Postgres `embedded select` syntax or a separate fetch — match how `expenses` does it).
- [ ] `getIncome(id)` — single row by id, with attachment.
- [ ] `createIncome(input)` — inserts. Input shape: `{ amount, currency, occurred_at, note?, source?, attachment_id? }`. `user_id` injected from `auth.uid()`.
- [ ] `updateIncome(id, patch)` — partial update; rejects changes to `user_id`.
- [ ] `deleteIncome(id)` — hard delete. Cascade handles the attachment row; storage object cleanup is the caller's responsibility (mirrors expenses behavior).

### Attachment helpers

Mirror the existing helpers in `src/features/expenses/api.ts`:

- [ ] `uploadIncomeAttachment(file, { userId, occurredAt })` — uploads to `income-attachments` bucket at `{userId}/{YYYY-MM}/{uuid}.{ext}` (month derived from `occurredAt`). Returns `{ storage_path }`.
- [ ] `createIncomeAttachment(input)` — inserts row with `storage_path`, `doc_type: 'unknown'`, `confirmed: false`, `ai_raw_extraction: null`, `ai_confidence: null`, `income_id: null`.
- [ ] `updateIncomeAttachment(id, patch)` — used to link `income_id` and set `confirmed: true` after the income row exists.
- [ ] `getIncomeAttachmentSignedUrl(storage_path)` — 60s signed URL for preview.
- [ ] `deleteIncomeAttachment(id)` — row only. Sibling `deleteIncomeAttachmentObject(path)` for storage cleanup.

### Types + errors

- [ ] All return shapes typed via `Database['public']['Tables']['incomes']['Row']` / `Insert` / `Update` and the equivalent for `income_attachments`.
- [ ] Storage SDK errors surfaced via the same `StorageResult<T>` type that expenses uses (defined in `src/features/expenses/api.ts` — promote to `src/lib/storage.ts` if both features now depend on it).
- [ ] Postgrest errors returned as-is — no swallowing.

### Verification

- [ ] `pnpm build` passes.
- [ ] `pnpm lint` passes.
- [ ] Manual smoke test via the form work in `03-pages-and-forms.md` (this task does not have a UI surface).

## Notes

(append-only)

- If the `StorageResult<T>` type ends up shared with expenses, hoist it to `src/lib/storage.ts` rather than re-defining. Update the expenses task notes if you do.
- The 4-step upload→insert→link→confirm flow lives in the form (task 03), not here. This file just exposes the primitives.
- AI extraction hook: leave a top-of-file comment block (same as expenses `api.ts`) documenting that the `ai-chat` slice will call `updateIncomeAttachment` with `ai_raw_extraction`, `ai_confidence`, and `doc_type` once Claude Vision returns.
