-- §12 handle_new_user
-- Auto-creates the profile row and seeds 10 default categories whenever
-- a new auth.users row is inserted.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.categories (user_id, name, tier, icon, color, sort_order) values
    (new.id, 'rent',          'fixed', 'home',          '#7a8d6a', 0),
    (new.id, 'internet',      'fixed', 'wifi',          '#7a8d6a', 1),
    (new.id, 'electricity',   'fixed', 'plug-zap',      '#7a8d6a', 2),
    (new.id, 'water',         'fixed', 'droplets',      '#7a8d6a', 3),
    (new.id, 'groceries',     'needs', 'shopping-cart', '#a3a86b', 0),
    (new.id, 'transport',     'needs', 'bus',           '#a3a86b', 1),
    (new.id, 'health',        'needs', 'heart-pulse',   '#a3a86b', 2),
    (new.id, 'dining out',    'wants', 'utensils',      '#c4a86b', 0),
    (new.id, 'subscriptions', 'wants', 'credit-card',   '#c4a86b', 1),
    (new.id, 'entertainment', 'wants', 'gamepad-2',     '#c4a86b', 2);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
