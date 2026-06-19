-- §8 budgets

create table public.budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid          not null references auth.users(id) on delete cascade,
  category_id   uuid          not null references public.categories(id) on delete cascade,
  period_year   smallint      not null check (period_year between 2020 and 2100),
  period_month  smallint      not null check (period_month between 1 and 12),
  amount        numeric(15,2) not null check (amount >= 0),
  currency      text          not null check (currency in (
    'IDR','USD','EUR','JPY','GBP','SGD','MYR','AUD',
    'CAD','CNY','KRW','HKD','THB','PHP','INR','VND'
  )),
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

-- §8a tier_budgets
-- Per-tier monthly cap. Independent of the per-category budgets above (NOT a
-- rollup) — a user can cap a whole tier without itemizing every category.
-- One row per (user_id, tier_id, period_year, period_month).

create table public.tier_budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid          not null references auth.users(id) on delete cascade,
  tier_id       uuid          not null references public.tiers(id) on delete cascade,
  period_year   smallint      not null check (period_year between 2020 and 2100),
  period_month  smallint      not null check (period_month between 1 and 12),
  amount        numeric(15,2) not null check (amount >= 0),
  currency      text          not null check (currency in (
    'IDR','USD','EUR','JPY','GBP','SGD','MYR','AUD',
    'CAD','CNY','KRW','HKD','THB','PHP','INR','VND'
  )),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  unique (user_id, tier_id, period_year, period_month)
);

create index tier_budgets_user_id_idx     on public.tier_budgets (user_id);
create index tier_budgets_user_period_idx on public.tier_budgets (user_id, period_year, period_month);

create trigger set_updated_at before update on public.tier_budgets
  for each row execute function public.set_updated_at();

alter table public.tier_budgets enable row level security;

create policy "tier_budgets: select own" on public.tier_budgets for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "tier_budgets: insert own" on public.tier_budgets for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "tier_budgets: update own" on public.tier_budgets for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "tier_budgets: delete own" on public.tier_budgets for delete to authenticated
  using ( user_id = (select auth.uid()) );
