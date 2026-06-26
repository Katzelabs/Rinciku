-- §12 handle_new_user
-- Auto-creates the profile row, seeds 1 default tier, seeds 3 default
-- categories (pointed at that tier), and seeds 4 default income categories
-- whenever a new auth.users row is inserted. Kept intentionally minimal so a
-- new user starts with a small set they can build on, rather than a long list.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_needs uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  -- Default tier. Counts toward the essentials baseline math.
  -- Users can rename/recolor/add/delete tiers afterwards.
  insert into public.tiers (user_id, name, color, is_essential, sort_order)
    values (new.id, 'Needs', '#a3a86b', true, 0) returning id into v_needs;

  insert into public.categories (user_id, name, tier_id, icon, color, sort_order) values
    (new.id, 'rent',      v_needs, 'home',          '#a3a86b', 0),
    (new.id, 'groceries', v_needs, 'shopping-cart', '#a3a86b', 1),
    (new.id, 'transport', v_needs, 'bus',           '#a3a86b', 2);

  -- Default income categories (flat — no tier). Users can rename/recolor/add/delete.
  -- Icon names are PascalCase lucide keys (see src/features/categories/lib/icons.ts).
  insert into public.income_categories (user_id, name, icon, color, sort_order) values
    (new.id, 'Salary',     'Banknote',   '#7a8d6a', 0),
    (new.id, 'Freelance',  'Briefcase',  '#a3a86b', 1),
    (new.id, 'Investment', 'TrendingUp', '#6b8da3', 2),
    (new.id, 'Other',      'Wallet',     '#8d8d8d', 3);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
