-- Seeded data applied on `supabase db reset` (after migrations run).
-- Declarative schemas only handle DDL, so DML lives here.

-- §11 storage bucket — policies are declared in schemas/90_storage_policies.sql.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-attachments',
  'expense-attachments',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic']
)
on conflict (id) do nothing;
