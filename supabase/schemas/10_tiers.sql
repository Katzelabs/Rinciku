-- §tiers
-- User-defined spending tiers. Free-form: arbitrary names, user-chosen color,
-- and an `is_essential` flag that drives the dashboard baseline-covered math
-- (replacing the old hardcoded "fixed + needs = essentials" rule).
-- Seeded with three defaults (Fixed / Needs / Wants) by handle_new_user.

create table public.tiers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null,
  color        text        check (color ~ '^#[0-9a-fA-F]{6}$'),
  is_essential boolean     not null default false,
  sort_order   int         not null default 0,
  is_archived  boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, name)
);

create index tiers_user_id_idx        on public.tiers (user_id);
create index tiers_user_sort_idx      on public.tiers (user_id, sort_order);

create trigger set_updated_at before update on public.tiers
  for each row execute function public.set_updated_at();

alter table public.tiers enable row level security;

create policy "tiers: select own" on public.tiers for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "tiers: insert own" on public.tiers for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "tiers: update own" on public.tiers for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "tiers: delete own" on public.tiers for delete to authenticated
  using ( user_id = (select auth.uid()) );
