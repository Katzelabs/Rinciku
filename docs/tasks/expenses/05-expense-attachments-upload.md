**Status:** not-started

## Goal

Wire up image upload to the `expense-attachments` Supabase Storage bucket and create the corresponding `expense_attachments` row. The AI-extraction half (Claude Vision call, inline review UI) belongs to the future `ai-chat/` slice; this task delivers the upload + storage record so that work has something to plug into.

Reference: `docs/schema.md` §7 `expense_attachments` and §11 storage bucket. Path pattern: `{user_id}/{year}-{month}/{uuid}.{ext}`.

## Acceptance criteria

- [ ] `src/features/expenses/api.ts` adds `uploadAttachment(file)` — uploads to `expense-attachments` at the path pattern above, returns `{ storage_path }`.
- [ ] `src/features/expenses/api.ts` adds `createAttachment(input)` — inserts an `expense_attachments` row with `storage_path`, `doc_type: 'unknown'`, `confirmed: false`, and any `ai_raw_extraction` left null for now.
- [ ] `getAttachmentSignedUrl(storage_path)` returns a short-lived signed URL (60s) for previewing in the UI.
- [ ] `ExpenseForm` from `03-expense-form.md` gains an optional drop zone (shadcn-styled) that accepts the bucket's allowed mime types (`image/jpeg`, `image/png`, `image/webp`, `image/heic`) and ≤ 10 MB.
- [ ] Submit flow when an image is attached: upload → create attachment row → create expense linking `attachment_id` → mark attachment `confirmed = true`. Wrap in a try/catch that cleans up the storage object if the DB insert fails.
- [ ] No Claude API call in this task — `ai_raw_extraction` stays null and `doc_type` stays `'unknown'`. Note in the file where the ai-chat slice will hook in.

## Notes
