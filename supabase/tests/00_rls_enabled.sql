-- Schema-wide security invariants. These are generic on purpose: they cover
-- every CURRENT and FUTURE public table, so a forgotten `enable row level
-- security` or a regenerated grant fails CI instead of shipping.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

-- 1. RLS must be enabled on every table in public.
select is(
  (select count(*)::int from pg_tables
   where schemaname = 'public' and rowsecurity = false),
  0,
  'every public table has row level security enabled'
);

-- 2. Every public table has at least one policy (RLS enabled with zero
--    policies silently blocks the app rather than protecting it). Tables that
--    are deny-all BY DESIGN (reached only via security definer functions) are
--    allowlisted here — adding one means updating this list deliberately.
select is(
  (select count(*)::int from pg_tables t
   where t.schemaname = 'public'
     and t.tablename not in ('rate_limit_hits')
     and not exists (
       select 1 from pg_policies p
       where p.schemaname = 'public' and p.tablename = t.tablename
     )),
  0,
  'every public table has at least one RLS policy (or is allowlisted deny-all)'
);

-- 3. anon must hold ZERO table privileges (95_grants.sql revokes; the
--    diff engine cannot regenerate revokes, so this guards against drift
--    between schemas/95_grants.sql and the hand-maintained migration).
select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon'),
  0,
  'anon has no table privileges in public'
);

-- 4. authenticated must not hold privileges RLS cannot gate.
select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'authenticated'
     and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')),
  0,
  'authenticated cannot truncate/references/trigger any public table'
);

-- 5+6. Behavioral check of the anon lockout on a representative table.
set local role anon;
select throws_ok(
  'select count(*) from public.expenses',
  '42501', null,
  'anon cannot read expenses'
);
select throws_ok(
  $$insert into public.expenses (user_id, amount, currency)
    values (gen_random_uuid(), 1, 'IDR')$$,
  '42501', null,
  'anon cannot insert expenses'
);
reset role;

select * from finish();
rollback;
