-- §4 categories

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  tier_id     uuid        references public.tiers(id) on delete set null,
  icon        text,
  color       text        check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order  int         not null default 0,
  is_archived boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index categories_user_id_idx        on public.categories (user_id);
create index categories_user_tier_sort_idx on public.categories (user_id, tier_id, sort_order);

create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

create policy "categories: select own" on public.categories for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "categories: insert own" on public.categories for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "categories: update own" on public.categories for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "categories: delete own" on public.categories for delete to authenticated
  using ( user_id = (select auth.uid()) );
