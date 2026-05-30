-- §5 essentials

create table public.essentials (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid          not null references auth.users(id) on delete cascade,
  category_id      uuid          references public.categories(id) on delete set null,
  name             text          not null,
  estimated_amount numeric(15,2) not null check (estimated_amount >= 0),
  currency         text          not null check (currency in ('IDR','USD')),
  is_active        boolean       not null default true,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

create index essentials_user_id_idx     on public.essentials (user_id);
create index essentials_user_active_idx on public.essentials (user_id, is_active);

create trigger set_updated_at before update on public.essentials
  for each row execute function public.set_updated_at();

alter table public.essentials enable row level security;

create policy "essentials: select own" on public.essentials for select to authenticated
  using ( user_id = (select auth.uid()) );
create policy "essentials: insert own" on public.essentials for insert to authenticated
  with check ( user_id = (select auth.uid()) );
create policy "essentials: update own" on public.essentials for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
create policy "essentials: delete own" on public.essentials for delete to authenticated
  using ( user_id = (select auth.uid()) );
