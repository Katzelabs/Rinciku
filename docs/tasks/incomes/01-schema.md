**Status:** done

## Goal

Add the `incomes` and `income_attachments` tables to the schema (both SQL files and `docs/schema.md`). Mirror the `expenses` / `expense_attachments` shape, minus categories, and add the new `income-attachments` storage bucket with parallel RLS policies. This is the prerequisite for the income API and form work.

Coordinated with `foundation/05-base-currency-and-cleanup.md` — both regen into the single rolling-init migration.

## Acceptance criteria

### `supabase/schemas/18_incomes.sql` (new)

- [x] Columns: `id uuid pk default gen_random_uuid()`, `user_id uuid not null references auth.users(id) on delete cascade`, `amount numeric(15,2) not null check (amount > 0)`, `currency text not null` with the 16-code check, `occurred_at timestamptz not null default now()`, `note text`, `source text not null default 'manual'` with check `('manual','chat','image')`, `attachment_id uuid` (FK added after `income_attachments` exists — circular FK pattern), `created_at`, `updated_at`.
- [x] `set_updated_at` trigger attached.
- [x] Standard four-policy RLS on `user_id`.
- [x] Indexes: `incomes (user_id)`, `incomes (user_id, occurred_at desc)`, `incomes (user_id, source)`.
- [x] FK to `income_attachments(id)` added via `alter table ... add constraint` after the second file, with `on delete set null`.

### `supabase/schemas/19_income_attachments.sql` (new)

- [x] Exact mirror of `14_expense_attachments.sql` with `expense_id` → `income_id` (nullable until linked), FK to `incomes(id) on delete cascade` (added post-hoc).
- [x] Same `doc_type` allow-list (`'receipt','transfer','invoice','ewallet','unknown'`) — receipt stays as a valid type even though it's less common for incoming-money documents; keep symmetric with expenses to avoid divergence.
- [x] Same RLS pattern; inserts with `income_id = null` allowed.
- [x] Indexes: `(user_id)`, `(user_id, confirmed)`, `(income_id)`.

### `supabase/schemas/90_storage_policies.sql`

- [x] Add four policies for a new `income-attachments` bucket, mirroring the `expense-attachments` policies. Path pattern: `{user_id}/{YYYY}-{MM}/{uuid}.{ext}` (same as expenses).
- [x] Bucket itself is created in `supabase/seed.sql` (or whichever file currently bootstraps the `expense-attachments` bucket) — `name = 'income-attachments'`, `public = false`, `file_size_limit = 10485760`, `allowed_mime_types = image/jpeg, image/png, image/webp, image/heic, application/pdf`. (PDF added in case payslips arrive as PDF — confirm before extending the type set.)

### `docs/schema.md`

- [x] Add new sections for `incomes` and `income_attachments` between §6 and §7 (renumber subsequent sections, or append after §10 — match the existing ordering convention).
- [x] Update §2 entity diagram to show the new tables.
- [x] Update §11 storage section to describe the second bucket.
- [x] Update §13 indexes summary with the new indexes.

### Migration + types

- [x] Regen `supabase/migrations/0001_init.sql` via `supabase db diff -f init` (jointly with `foundation/05`).
- [x] `supabase db reset` runs clean.
- [x] `supabase gen types` produces typings for `incomes` and `income_attachments`.

## Notes

(append-only)

- Bucket choice: separate `income-attachments` rather than reusing `expense-attachments`. Chosen for parallel-feature symmetry; the RLS duplication is cheap.
- `doc_type` set kept identical to expenses on purpose — divergence here costs more than it saves. If/when a clearly-income-only type emerges (e.g. `'payslip'`), add it to both for consistency.
- Sanity check: when an attachment is deleted via cascade-from-income, the storage object is **not** auto-removed (same caveat as expenses — documented in `docs/schema.md` §11). The API layer in `02-api-and-attachments.md` handles object cleanup explicitly.
- 2026-06-09 — landed. `18_incomes.sql` and `19_income_attachments.sql` written, registered in `supabase/config.toml` schema_paths, four `income-attachments` storage policies appended to `90_storage_policies.sql`, bucket bootstrap added to `supabase/seed.sql` (PDF included). `docs/schema.md` restructured: incomes / income_attachments inserted as §8/§9, sections §8–§14 renumbered to §10–§16, storage section consolidated into "Storage — attachment buckets" describing both buckets, entity diagram + indexes summary updated. Single rolling-init migration regenerated to `20260609132808_init.sql`; `supabase db reset` clean; `supabase gen types` produced `incomes` and `income_attachments` typings.
