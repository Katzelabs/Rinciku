-- §8 incomes
-- attachment_id FK references income_attachments — the second half of a
-- circular FK pair. The matching FK lives in 19_income_attachments.sql.
-- Parallel structure to expenses. source_id points at a flat income_categories
-- row (11_income_categories); on delete set null so deleting a source leaves the
-- income intact but uncategorized (mirrors expenses.category_id).

create table public.incomes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid          not null references auth.users(id) on delete cascade,
  source_id      uuid          references public.income_categories(id) on delete set null,
  amount         numeric(15,2) not null check (amount > 0),
  currency       text          not null check (currency in (
    'IDR','USD','EUR','JPY','GBP','SGD','MYR','AUD',
    'CAD','CNY','KRW','HKD','THB','PHP','INR','VND'
  )),
  occurred_at    timestamptz   not null default now(),
  note           text,
  source         text          not null default 'manual'
    check (source in ('manual','chat','image')),
  attachment_id  uuid,
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now()
);

create index incomes_user_id_idx          on public.incomes (user_id);
create index incomes_user_occurred_at_idx on public.incomes (user_id, occurred_at desc);
create index incomes_user_source_idx      on public.incomes (user_id, source);
create index incomes_user_source_id_idx   on public.incomes (user_id, source_id);

create trigger set_updated_at before update on public.incomes
  for each row execute function public.set_updated_at();

alter table public.incomes enable row level security;

create policy "incomes: select own" on public.incomes for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "incomes: insert own" on public.incomes for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "incomes: update own" on public.incomes for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "incomes: delete own" on public.incomes for delete to authenticated
  using ( user_id = (select auth.uid()) );
