-- Two-user RLS isolation. Alice owns a row in every core value table;
-- Bob (authenticated) must not be able to see, spoof, modify, or delete any
-- of it. Setup runs as postgres (RLS-exempt); assertions run as each user by
-- setting the role + JWT claims the way PostgREST does.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(27);

-- ── setup (as postgres) ─────────────────────────────────────────────────────
-- handle_new_user seeds each user's profile, 1 tier, 3 categories, and
-- 4 income categories.
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'authenticated', 'authenticated', 'alice@rls.test', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'authenticated', 'authenticated', 'bob@rls.test', now(), now());

insert into expenses (id, user_id, category_id, amount, currency, note)
select 'e0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
       c.id, 50000, 'IDR', 'alice lunch'
from categories c
where c.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' limit 1;

insert into essentials (id, user_id, name, estimated_amount, currency) values
  ('e0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Rent', 2000000, 'IDR');

insert into incomes (id, user_id, source_id, amount, currency)
select 'e0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
       ic.id, 10000000, 'IDR'
from income_categories ic
where ic.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' limit 1;

insert into budgets (id, user_id, category_id, period_year, period_month, amount, currency)
select 'e0000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
       c.id, 2026, 7, 1500000, 'IDR'
from categories c
where c.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' limit 1;

insert into conversations (id, user_id, title) values
  ('e0000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'alice budget chat');

insert into messages (id, conversation_id, user_id, role, content) values
  ('e0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000005',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user', 'can I afford this?');

-- ── as alice: sees and manages her own data ────────────────────────────────
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  'select id from profiles',
  array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid],
  'alice sees exactly one profile: her own'
);
select is(
  (select count(*)::int from categories), 3,
  'alice sees only her 3 seeded categories'
);
select is(
  (select count(*)::int from expenses), 1,
  'alice sees her expense'
);
select isnt_empty(
  $$update expenses set note = 'updated'
    where id = 'e0000000-0000-0000-0000-000000000001' returning id$$,
  'alice can update her own expense'
);

-- ── as bob: alice's data is invisible ──────────────────────────────────────
reset role;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from profiles
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 0,
  'bob cannot see alice''s profile');
select is((select count(*)::int from categories
  where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 0,
  'bob cannot see alice''s categories');
select is((select count(*)::int from expenses), 0,
  'bob sees zero expenses (alice''s are invisible)');
select is((select count(*)::int from essentials), 0,
  'bob sees zero essentials');
select is((select count(*)::int from incomes), 0,
  'bob sees zero incomes');
select is((select count(*)::int from budgets), 0,
  'bob sees zero budgets');
select is((select count(*)::int from conversations), 0,
  'bob sees zero conversations');
select is((select count(*)::int from messages), 0,
  'bob sees zero messages');

-- ── as bob: cannot insert rows on alice's behalf (spoofed user_id) ─────────
select throws_ok(
  $$insert into expenses (user_id, amount, currency)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 100, 'IDR')$$,
  '42501', null, 'bob cannot insert an expense for alice');
select throws_ok(
  $$insert into categories (user_id, name)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'planted')$$,
  '42501', null, 'bob cannot insert a category for alice');
select throws_ok(
  $$insert into tiers (user_id, name)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'planted')$$,
  '42501', null, 'bob cannot insert a tier for alice');
select throws_ok(
  $$insert into essentials (user_id, name, estimated_amount, currency)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'planted', 1, 'IDR')$$,
  '42501', null, 'bob cannot insert an essential for alice');
select throws_ok(
  $$insert into incomes (user_id, amount, currency)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'IDR')$$,
  '42501', null, 'bob cannot insert an income for alice');
select throws_ok(
  $$insert into income_categories (user_id, name)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'planted')$$,
  '42501', null, 'bob cannot insert an income category for alice');
select throws_ok(
  $$insert into budgets (user_id, category_id, period_year, period_month, amount, currency)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', gen_random_uuid(), 2026, 7, 1, 'IDR')$$,
  '42501', null, 'bob cannot insert a budget for alice');
select throws_ok(
  $$insert into conversations (user_id, title)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'planted')$$,
  '42501', null, 'bob cannot insert a conversation for alice');
select throws_ok(
  $$insert into messages (conversation_id, user_id, role, content)
    values ('e0000000-0000-0000-0000-000000000005',
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user', 'spoofed')$$,
  '42501', null, 'bob cannot insert a message as alice');

-- Regression (2026-07-14): the FK to conversations bypasses its RLS, so the
-- insert policy must itself require owning the conversation — without that,
-- this insert (bob's own user_id, alice's conversation) succeeded.
select throws_ok(
  $$insert into messages (conversation_id, user_id, role, content)
    values ('e0000000-0000-0000-0000-000000000005',
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user', 'injected')$$,
  '42501', null, 'bob cannot write into alice''s conversation with his own user_id');

-- ── as bob: updates/deletes of alice's rows affect nothing ─────────────────
select is_empty(
  $$update expenses set note = 'pwned'
    where id = 'e0000000-0000-0000-0000-000000000001' returning id$$,
  'bob cannot update alice''s expense');
select is_empty(
  $$update profiles set display_name = 'pwned'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning id$$,
  'bob cannot update alice''s profile');
select is_empty(
  $$update conversations set title = 'pwned'
    where id = 'e0000000-0000-0000-0000-000000000005' returning id$$,
  'bob cannot update alice''s conversation');
select is_empty(
  $$delete from expenses
    where id = 'e0000000-0000-0000-0000-000000000001' returning id$$,
  'bob cannot delete alice''s expense');
select is_empty(
  $$delete from messages
    where id = 'e0000000-0000-0000-0000-000000000006' returning id$$,
  'bob cannot delete alice''s message');

reset role;
select * from finish();
rollback;
