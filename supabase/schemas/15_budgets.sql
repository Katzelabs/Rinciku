-- §8 budgets

create table public.budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid          not null references auth.users(id) on delete cascade,
  category_id   uuid          not null references public.categories(id) on delete cascade,
  period_year   smallint      not null check (period_year between 2020 and 2100),
  period_month  smallint      not null check (period_month between 1 and 12),
  amount_idr    numeric(15,2) not null check (amount_idr >= 0),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  unique (user_id, category_id, period_year, period_month)
);

create index budgets_user_id_idx     on public.budgets (user_id);
create index budgets_user_period_idx on public.budgets (user_id, period_year, period_month);

create trigger set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();

alter table public.budgets enable row level security;

create policy "budgets: select own" on public.budgets for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "budgets: insert own" on public.budgets for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "budgets: update own" on public.budgets for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "budgets: delete own" on public.budgets for delete to authenticated
  using ( user_id = (select auth.uid()) );
