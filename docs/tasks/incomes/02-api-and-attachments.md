**Status:** done

## Goal

Build `src/features/incomes/api.ts` with full CRUD + attachment helpers, mirroring the patterns in `src/features/expenses/api.ts` (around lines 139–193 for the attachment helpers). Returns typed rows from `src/lib/database.types.ts`, surfaces `PostgrestError` to the caller, and keeps business logic out — this is the data layer.

Depends on `incomes/01-schema.md` (tables + bucket must exist and types must be regenerated).

## Acceptance criteria

### CRUD

- [x] `listIncomes(opts?)` — selects from `incomes`, optionally filtered by date range, ordered by `occurred_at desc`. Returns rows with `attachment` joined when present (left join via Postgres `embedded select` syntax or a separate fetch — match how `expenses` does it).
- [x] `getIncome(id)` — single row by id, with attachment.
- [x] `createIncome(input)` — inserts. Input shape: `{ amount, currency, occurred_at, note?, source?, attachment_id? }`. `user_id` injected from `auth.uid()`.
- [x] `updateIncome(id, patch)` — partial update; rejects changes to `user_id`.
- [x] `deleteIncome(id)` — hard delete. Cascade handles the attachment row; storage object cleanup is the caller's responsibility (mirrors expenses behavior).

### Attachment helpers

Mirror the existing helpers in `src/features/expenses/api.ts`:

- [x] `uploadIncomeAttachment(file, { userId, occurredAt })` — uploads to `income-attachments` bucket at `{userId}/{YYYY-MM}/{uuid}.{ext}` (month derived from `occurredAt`). Returns `{ storage_path }`.
- [x] `createIncomeAttachment(input)` — inserts row with `storage_path`, `doc_type: 'unknown'`, `confirmed: false`, `ai_raw_extraction: null`, `ai_confidence: null`, `income_id: null`.
- [x] `updateIncomeAttachment(id, patch)` — used to link `income_id` and set `confirmed: true` after the income row exists.
- [x] `getIncomeAttachmentSignedUrl(storage_path)` — 60s signed URL for preview.
- [x] `deleteIncomeAttachment(id)` — row only. Sibling `deleteIncomeAttachmentObject(path)` for storage cleanup.

### Types + errors

- [x] All return shapes typed via `Database['public']['Tables']['incomes']['Row']` / `Insert` / `Update` and the equivalent for `income_attachments`.
- [x] Storage SDK errors surfaced via the same `StorageResult<T>` type that expenses uses (defined in `src/features/expenses/api.ts` — promote to `src/lib/storage.ts` if both features now depend on it).
- [x] Postgrest errors returned as-is — no swallowing.

### Verification

- [x] `pnpm build` passes.
- [x] `pnpm lint` passes.
- [x] Manual smoke test via the form work in `03-pages-and-forms.md` (this task does not have a UI surface).

## Notes

(append-only)

- If the `StorageResult<T>` type ends up shared with expenses, hoist it to `src/lib/storage.ts` rather than re-defining. Update the expenses task notes if you do.
- The 4-step upload→insert→link→confirm flow lives in the form (task 03), not here. This file just exposes the primitives.
- AI extraction hook: leave a top-of-file comment block (same as expenses `api.ts`) documenting that the `ai-chat` slice will call `updateIncomeAttachment` with `ai_raw_extraction`, `ai_confidence`, and `doc_type` once Claude Vision returns.
- 2026-06-09 — landed. `src/features/incomes/api.ts` exports the full CRUD set + attachment helpers, mirroring `src/features/expenses/api.ts` minus categories. `MIME_TO_EXT` and `KNOWN_EXTS` extended with `application/pdf` / `pdf`. Top-of-file comment block documents the future ai-chat hook. `Result<T>` / `StorageResult<T>` left as local types — no third caller yet, so hoisting to `src/lib/storage.ts` is premature.
