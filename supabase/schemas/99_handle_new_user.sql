-- §12 handle_new_user
-- Auto-creates the profile row, seeds 3 default tiers, seeds 10 default
-- categories (pointed at those tiers), and seeds 4 default income categories
-- whenever a new auth.users row is inserted.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fixed uuid;
  v_needs uuid;
  v_wants uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  -- Default tiers. Fixed + Needs count toward the essentials baseline math;
  -- Wants does not. Users can rename/recolor/add/delete tiers afterwards.
  insert into public.tiers (user_id, name, color, is_essential, sort_order)
    values (new.id, 'Fixed', '#7a8d6a', true, 0) returning id into v_fixed;
  insert into public.tiers (user_id, name, color, is_essential, sort_order)
    values (new.id, 'Needs', '#a3a86b', true, 1) returning id into v_needs;
  insert into public.tiers (user_id, name, color, is_essential, sort_order)
    values (new.id, 'Wants', '#c4a86b', false, 2) returning id into v_wants;

  insert into public.categories (user_id, name, tier_id, icon, color, sort_order) values
    (new.id, 'rent',          v_fixed, 'home',          '#7a8d6a', 0),
    (new.id, 'internet',      v_fixed, 'wifi',          '#7a8d6a', 1),
    (new.id, 'electricity',   v_fixed, 'plug-zap',      '#7a8d6a', 2),
    (new.id, 'water',         v_fixed, 'droplets',      '#7a8d6a', 3),
    (new.id, 'groceries',     v_needs, 'shopping-cart', '#a3a86b', 0),
    (new.id, 'transport',     v_needs, 'bus',           '#a3a86b', 1),
    (new.id, 'health',        v_needs, 'heart-pulse',   '#a3a86b', 2),
    (new.id, 'dining out',    v_wants, 'utensils',      '#c4a86b', 0),
    (new.id, 'subscriptions', v_wants, 'credit-card',   '#c4a86b', 1),
    (new.id, 'entertainment', v_wants, 'gamepad-2',     '#c4a86b', 2);

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
