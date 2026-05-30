-- §7 expense_attachments
-- Closes the circular FK pair with public.expenses (defined in 13_expenses.sql).

create table public.expense_attachments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  expense_id         uuid,
  storage_path       text        not null,
  doc_type           text        check (doc_type in ('receipt','transfer','invoice','ewallet','unknown')),
  mime_type          text,
  file_size_bytes    int,
  ai_raw_extraction  jsonb,
  ai_confidence      numeric(3,2) check (ai_confidence between 0 and 1),
  confirmed          boolean     not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Circular FKs (§6 ↔ §7) — added once both tables exist.
alter table public.expenses
  add constraint expenses_attachment_id_fkey
  foreign key (attachment_id) references public.expense_attachments(id)
  on delete set null;

alter table public.expense_attachments
  add constraint expense_attachments_expense_id_fkey
  foreign key (expense_id) references public.expenses(id)
  on delete cascade;

create index expense_attachments_user_id_idx        on public.expense_attachments (user_id);
create index expense_attachments_user_confirmed_idx on public.expense_attachments (user_id, confirmed);
create index expense_attachments_expense_id_idx     on public.expense_attachments (expense_id);

create trigger set_updated_at before update on public.expense_attachments
  for each row execute function public.set_updated_at();

alter table public.expense_attachments enable row level security;

create policy "expense_attachments: select own" on public.expense_attachments for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "expense_attachments: insert own" on public.expense_attachments for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "expense_attachments: update own" on public.expense_attachments for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "expense_attachments: delete own" on public.expense_attachments for delete to authenticated
  using ( user_id = (select auth.uid()) );
