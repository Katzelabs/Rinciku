-- §3 profiles
-- One row per auth.users. No delete policy — cascades from auth.users.

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  display_name        text,
  base_currency       text         not null default 'IDR'
    check (base_currency in ('IDR','USD')),
  monthly_income_idr  numeric(15,2) not null default 0,
  monthly_income_usd  numeric(15,2) not null default 0,
  month_start_day     smallint     not null default 1
    check (month_start_day between 1 and 28),
  onboarded_at        timestamptz,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles for select to authenticated
  using ( id = (select auth.uid()) );
create policy "profiles: insert own" on public.profiles for insert to authenticated
  with check ( id = (select auth.uid()) );
create policy "profiles: update own" on public.profiles for update to authenticated
  using ( id = (select auth.uid()) )
  with check ( id = (select auth.uid()) );
