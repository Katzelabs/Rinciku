-- §11 storage policies for the `expense-attachments` bucket.
-- The bucket itself is created by supabase/seed.sql (declarative schemas
-- handle DDL only). Object paths are namespaced by `<auth.uid()>/...`.

create policy "expense-attachments: select own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'expense-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "expense-attachments: insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'expense-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "expense-attachments: update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'expense-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "expense-attachments: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'expense-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
