-- §4b income_categories
-- Per-user income taxonomy (e.g. Salary, Freelance, Investment). Flat — unlike
-- spending `categories` there is no tier: tiers carry is_essential baseline math
-- that is meaningless for income. Referenced by incomes.source_id (18_incomes).

create table public.income_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  icon        text,
  color       text        check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order  int         not null default 0,
  is_archived boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index income_categories_user_id_idx   on public.income_categories (user_id);
create index income_categories_user_sort_idx  on public.income_categories (user_id, sort_order);

create trigger set_updated_at before update on public.income_categories
  for each row execute function public.set_updated_at();

alter table public.income_categories enable row level security;

create policy "income_categories: select own" on public.income_categories for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "income_categories: insert own" on public.income_categories for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "income_categories: update own" on public.income_categories for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "income_categories: delete own" on public.income_categories for delete to authenticated
  using ( user_id = (select auth.uid()) );
