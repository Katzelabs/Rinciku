**Status:** done

## Goal

Wire up image upload to the `expense-attachments` Supabase Storage bucket and create the corresponding `expense_attachments` row. The AI-extraction half (Claude Vision call, inline review UI) belongs to the future `ai-chat/` slice; this task delivers the upload + storage record so that work has something to plug into.

Reference: `docs/schema.md` §7 `expense_attachments` and §11 storage bucket. Path pattern: `{user_id}/{year}-{month}/{uuid}.{ext}`.

## Acceptance criteria

- [x] `src/features/expenses/api.ts` adds `uploadAttachment(file)` — uploads to `expense-attachments` at the path pattern above, returns `{ storage_path }`.
- [x] `src/features/expenses/api.ts` adds `createAttachment(input)` — inserts an `expense_attachments` row with `storage_path`, `doc_type: 'unknown'`, `confirmed: false`, and any `ai_raw_extraction` left null for now.
- [x] `getAttachmentSignedUrl(storage_path)` returns a short-lived signed URL (60s) for previewing in the UI.
- [x] `ExpenseForm` from `03-expense-form.md` gains an optional drop zone (shadcn-styled) that accepts the bucket's allowed mime types (`image/jpeg`, `image/png`, `image/webp`, `image/heic`) and ≤ 10 MB.
- [x] Submit flow when an image is attached: upload → create attachment row → create expense linking `attachment_id` → mark attachment `confirmed = true`. Wrap in a try/catch that cleans up the storage object if the DB insert fails.
- [x] No Claude API call in this task — `ai_raw_extraction` stays null and `doc_type` stays `'unknown'`. Note in the file where the ai-chat slice will hook in.

## Notes

- API helpers landed in `src/features/expenses/api.ts`: `uploadAttachment`, `createAttachment`, `updateAttachment`, `getAttachmentSignedUrl`, `deleteAttachment`, `deleteAttachmentObject`. Path uses `occurred_at`'s year/month so attachments cluster by the month they belong to. Storage SDK errors surface via a sibling `StorageResult<T>` type whose `error` is `Error | null` (avoids depending on `@supabase/storage-js` directly, which is a transitive dep).
- New component `src/features/expenses/components/attachment-dropzone.tsx` — click-or-drag drop zone, client-side mime + 10 MB checks, object-URL thumbnail preview (no signed URL until after submit).
- `ExpenseForm` shows the drop zone in create mode only (a `TODO` flags replacing/removing the attachment in edit mode as out-of-scope follow-up). Submit flow: upload → createAttachment → createExpense (with `attachment_id`) → updateAttachment to set `expense_id` + `confirmed = true`. Each step rolls back the storage object (and attachment row, where present) on failure. The confirm step is best-effort — its failure only logs, keeping the expense as the source of truth.
- Hook-in for the ai-chat slice is documented as a top-of-file comment block in `api.ts`: it will call `updateAttachment` with `ai_raw_extraction`, `ai_confidence`, and `doc_type` once Claude Vision returns.
- Verified with `pnpm build` and `pnpm lint` — both green. Manual browser verification deferred to whoever runs Supabase locally next.
