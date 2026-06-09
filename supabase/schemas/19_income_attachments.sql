-- §9 income_attachments
-- Closes the circular FK pair with public.incomes (defined in 18_incomes.sql).
-- doc_type allow-list kept identical to expense_attachments on purpose — the
-- divergence cost outweighs the per-side fit.

create table public.income_attachments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  income_id          uuid,
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

-- Circular FKs (§8 ↔ §9) — added once both tables exist.
alter table public.incomes
  add constraint incomes_attachment_id_fkey
  foreign key (attachment_id) references public.income_attachments(id)
  on delete set null;

alter table public.income_attachments
  add constraint income_attachments_income_id_fkey
  foreign key (income_id) references public.incomes(id)
  on delete cascade;

create index income_attachments_user_id_idx        on public.income_attachments (user_id);
create index income_attachments_user_confirmed_idx on public.income_attachments (user_id, confirmed);
create index income_attachments_income_id_idx      on public.income_attachments (income_id);

create trigger set_updated_at before update on public.income_attachments
  for each row execute function public.set_updated_at();

alter table public.income_attachments enable row level security;

create policy "income_attachments: select own" on public.income_attachments for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "income_attachments: insert own" on public.income_attachments for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "income_attachments: update own" on public.income_attachments for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "income_attachments: delete own" on public.income_attachments for delete to authenticated
  using ( user_id = (select auth.uid()) );
