-- Seeded data applied on `supabase db reset` (after migrations run).
-- Declarative schemas only handle DDL, so DML lives here.
--
-- Two parts:
--   1. Storage buckets (§13) — policies are declared in schemas/90_storage_policies.sql.
--   2. A ready-to-use demo account + sample finance data so you never have to
--      recreate an account or re-enter rows by hand after a `db reset`.
--
-- Demo login (local only):
--   email:    demo@rinciku.app
--   password: Password123
--
-- All transaction dates are computed relative to now() / the current month, so
-- the seed is always "up to date" — re-running it (or `db reset`) lands the data
-- in whatever the current billing cycle is, never a stale hardcoded month.

-- ---------------------------------------------------------------------------
-- 1. Storage buckets
-- ---------------------------------------------------------------------------
-- Buckets are declared in config.toml under [storage.buckets.*]. The CLI applies
-- that config on every `supabase start`/`db reset`, and it takes precedence over
-- SQL inserts here — so defining buckets in this seed only causes drift (a bucket
-- present in both places silently reverts to the config.toml values on reset).
-- Keep bucket size/MIME config in config.toml; this section is intentionally empty.

-- ---------------------------------------------------------------------------
-- 2. Demo account + sample data
-- ---------------------------------------------------------------------------
-- Inserting the auth.users row fires the handle_new_user trigger, which seeds
-- the profile, 3 tiers, 10 categories, and 4 income categories automatically.
-- We then enrich the profile and add essentials / expenses / incomes / budgets.

do $$
declare
  v_user_id  uuid        := '00000000-0000-0000-0000-0000000000d0';
  v_email    text        := 'demo@rinciku.app';

  -- Time anchors. month_start_day is 1 for the demo profile, so the current
  -- cycle is the calendar month. v_elapsed is "time since the 1st" — placing a
  -- row at v_cycle_start + v_elapsed * f (0 <= f <= 1) keeps it inside the cycle
  -- and at/before now() regardless of which day the seed runs.
  v_now         timestamptz := now();
  v_cycle_start timestamptz := date_trunc('month', v_now);
  v_prev_start  timestamptz := date_trunc('month', v_now) - interval '1 month';
  v_elapsed     interval    := v_now - date_trunc('month', v_now);

  -- spending category ids (seeded by handle_new_user)
  v_rent uuid; v_internet uuid; v_electricity uuid; v_water uuid;
  v_groceries uuid; v_transport uuid; v_health uuid;
  v_dining uuid; v_subscriptions uuid; v_entertainment uuid;

  -- income source ids (seeded by handle_new_user)
  v_salary uuid; v_freelance uuid; v_investment uuid;
begin
  -- Idempotent: wipe any previous demo user first. The cascade removes their
  -- profile, categories, expenses, incomes, budgets, etc. so a manual re-run of
  -- this seed against a live local DB starts clean.
  delete from auth.users where id = v_user_id;

  -- Auth user (email pre-confirmed so you can sign in immediately).
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated', 'authenticated',
    v_email,
    extensions.crypt('Password123', extensions.gen_salt('bf')),
    v_now, v_now, v_now,
    '{"provider":"email","providers":["email"]}',
    '{}',
    '', '', '', ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    extensions.gen_random_uuid(),
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    'email',
    v_now, v_now, v_now
  );

  -- Enrich the trigger-created profile with onboarding details.
  update public.profiles set
    display_name                     = 'Demo User',
    base_currency                    = 'IDR',
    expected_monthly_income          = 25000000,
    expected_monthly_income_currency = 'IDR',
    month_start_day                  = 1,
    onboarded_at                     = v_now
  where id = v_user_id;

  -- Resolve seeded category ids by name.
  select id into v_rent          from public.categories where user_id = v_user_id and name = 'rent';
  select id into v_internet      from public.categories where user_id = v_user_id and name = 'internet';
  select id into v_electricity   from public.categories where user_id = v_user_id and name = 'electricity';
  select id into v_water         from public.categories where user_id = v_user_id and name = 'water';
  select id into v_groceries     from public.categories where user_id = v_user_id and name = 'groceries';
  select id into v_transport     from public.categories where user_id = v_user_id and name = 'transport';
  select id into v_health        from public.categories where user_id = v_user_id and name = 'health';
  select id into v_dining        from public.categories where user_id = v_user_id and name = 'dining out';
  select id into v_subscriptions from public.categories where user_id = v_user_id and name = 'subscriptions';
  select id into v_entertainment from public.categories where user_id = v_user_id and name = 'entertainment';

  select id into v_salary     from public.income_categories where user_id = v_user_id and name = 'Salary';
  select id into v_freelance  from public.income_categories where user_id = v_user_id and name = 'Freelance';
  select id into v_investment from public.income_categories where user_id = v_user_id and name = 'Investment';

  -- Essentials — the monthly "baseline cost of living" (all in base IDR).
  insert into public.essentials (user_id, category_id, name, estimated_amount, currency, is_active) values
    (v_user_id, v_rent,        'apartment rent',     4500000, 'IDR', true),
    (v_user_id, v_internet,    'home internet',       350000, 'IDR', true),
    (v_user_id, v_electricity, 'electricity',         400000, 'IDR', true),
    (v_user_id, v_water,       'water',               150000, 'IDR', true),
    (v_user_id, v_groceries,   'monthly groceries',  2000000, 'IDR', true),
    (v_user_id, v_transport,   'fuel & transit',      600000, 'IDR', true);

  -- Expenses for the CURRENT cycle. occurred_at = v_cycle_start + v_elapsed * f
  -- keeps every row inside the current month and at/before now().
  insert into public.expenses (user_id, category_id, amount, currency, occurred_at, note, source) values
    (v_user_id, v_rent,          4500000, 'IDR', v_cycle_start + v_elapsed * 0.02, 'apartment rent',        'manual'),
    (v_user_id, v_internet,       350000, 'IDR', v_cycle_start + v_elapsed * 0.05, 'internet bill',         'manual'),
    (v_user_id, v_electricity,    412000, 'IDR', v_cycle_start + v_elapsed * 0.10, 'electricity bill',      'manual'),
    (v_user_id, v_groceries,      685000, 'IDR', v_cycle_start + v_elapsed * 0.15, 'weekly groceries',      'manual'),
    (v_user_id, v_transport,      120000, 'IDR', v_cycle_start + v_elapsed * 0.22, 'fuel top-up',           'manual'),
    (v_user_id, v_dining,         185000, 'IDR', v_cycle_start + v_elapsed * 0.30, 'lunch with friends',    'manual'),
    (v_user_id, v_groceries,      540000, 'IDR', v_cycle_start + v_elapsed * 0.42, 'groceries',             'manual'),
    (v_user_id, v_subscriptions,  169000, 'IDR', v_cycle_start + v_elapsed * 0.50, 'streaming + music',     'manual'),
    (v_user_id, v_health,         250000, 'IDR', v_cycle_start + v_elapsed * 0.58, 'pharmacy',              'manual'),
    (v_user_id, v_entertainment,  140000, 'IDR', v_cycle_start + v_elapsed * 0.66, 'cinema',                'chat'),
    (v_user_id, v_dining,         220000, 'IDR', v_cycle_start + v_elapsed * 0.78, 'dinner out',            'manual'),
    (v_user_id, v_transport,       95000, 'IDR', v_cycle_start + v_elapsed * 0.88, 'ride-hailing',          'manual'),
    (v_user_id, v_groceries,      430000, 'IDR', v_cycle_start + v_elapsed * 0.95, 'groceries',             'manual');

  -- A few PREVIOUS-month expenses for history (that cycle is fully elapsed,
  -- so fixed day offsets from its 1st are always valid).
  insert into public.expenses (user_id, category_id, amount, currency, occurred_at, note, source) values
    (v_user_id, v_rent,        4500000, 'IDR', v_prev_start + interval '1 day',  'apartment rent',   'manual'),
    (v_user_id, v_groceries,   1950000, 'IDR', v_prev_start + interval '6 days', 'monthly groceries','manual'),
    (v_user_id, v_dining,       760000, 'IDR', v_prev_start + interval '12 days','dining out',       'manual'),
    (v_user_id, v_transport,    540000, 'IDR', v_prev_start + interval '20 days','transport',        'manual');

  -- Incomes. Salary in base IDR on the 1st; a USD freelance payout shows the
  -- mixed-currency case the app is built for (stored in its own currency,
  -- converted at read time via the FX map).
  insert into public.incomes (user_id, source_id, amount, currency, occurred_at, note, source) values
    (v_user_id, v_salary,    25000000, 'IDR', v_cycle_start + interval '1 hour',  'monthly salary',      'manual'),
    (v_user_id, v_freelance,      500, 'USD', v_cycle_start + v_elapsed * 0.40,   'side gig invoice #7', 'manual'),
    (v_user_id, v_investment,   320000, 'IDR', v_cycle_start + v_elapsed * 0.70,  'dividend payout',     'manual'),
    -- previous month
    (v_user_id, v_salary,    25000000, 'IDR', v_prev_start + interval '1 hour',   'monthly salary',      'manual'),
    (v_user_id, v_freelance,      450, 'USD', v_prev_start + interval '14 days',  'side gig invoice #6', 'manual');

  -- Budgets for the current and previous month (per-category targets, base IDR).
  insert into public.budgets (user_id, category_id, period_year, period_month, amount, currency) values
    (v_user_id, v_groceries,     extract(year from v_now)::smallint,        extract(month from v_now)::smallint,        2500000, 'IDR'),
    (v_user_id, v_transport,     extract(year from v_now)::smallint,        extract(month from v_now)::smallint,         700000, 'IDR'),
    (v_user_id, v_dining,        extract(year from v_now)::smallint,        extract(month from v_now)::smallint,        1000000, 'IDR'),
    (v_user_id, v_entertainment, extract(year from v_now)::smallint,        extract(month from v_now)::smallint,         500000, 'IDR'),
    (v_user_id, v_subscriptions, extract(year from v_now)::smallint,        extract(month from v_now)::smallint,         300000, 'IDR'),
    (v_user_id, v_groceries,     extract(year from v_prev_start)::smallint, extract(month from v_prev_start)::smallint, 2200000, 'IDR'),
    (v_user_id, v_transport,     extract(year from v_prev_start)::smallint, extract(month from v_prev_start)::smallint,  700000, 'IDR'),
    (v_user_id, v_dining,        extract(year from v_prev_start)::smallint, extract(month from v_prev_start)::smallint,  900000, 'IDR');
end $$;
