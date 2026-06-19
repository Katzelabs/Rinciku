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

-- Cap active (non-archived) categories at 15 per tier. Only enforced when a
-- category is tiered; the "Untiered" bucket (tier deleted) is left uncapped.
-- Fires on insert and on a tier change, so a category can't be moved into a
-- full tier. `id <> new.id` keeps the move-trigger from counting itself.
create or replace function public.enforce_category_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.tier_id is not null
     and (select count(*) from public.categories
          where user_id = new.user_id
            and tier_id = new.tier_id
            and is_archived = false
            and id <> new.id) >= 15 then
    raise exception 'Category limit reached. Each tier can have at most 15 categories.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger enforce_category_limit before insert on public.categories
  for each row execute function public.enforce_category_limit();
create trigger enforce_category_limit_on_move before update of tier_id on public.categories
  for each row when (new.tier_id is distinct from old.tier_id)
  execute function public.enforce_category_limit();

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
