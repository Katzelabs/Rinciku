---
name: new-migration
description: Create a timestamped Supabase migration under supabase/migrations/ with schema DDL plus row-level security (RLS) policy templates. Defaults to a per-user owner check since Rinciku data is single-user-per-row.
---

# new-migration

## When to use

- The user asks to add or change a database table, column, index, or RLS policy.
- A new feature needs storage that doesn't exist yet (e.g. `expenses`, `budgets`, `essentials`).
- One logical change per migration — splitting "add expenses table" and "add budgets table" into two files is correct.

## Steps

1. **Generate the file** with the Supabase CLI to get a correct UTC timestamp:
   ```bash
   supabase migration new <snake_case_description>
   ```
   Example: `supabase migration new create_expenses_table` → `supabase/migrations/20260529120000_create_expenses_table.sql`.
   If the CLI is unavailable, hand-craft the filename: `YYYYMMDDHHMMSS_<description>.sql` (UTC).
2. **Write schema DDL** for the change. For a new table, always include:
   - `id uuid primary key default gen_random_uuid()` (or `bigint generated always as identity` if you don't need UUIDs)
   - `user_id uuid not null references auth.users(id) on delete cascade` (owner column for RLS)
   - `created_at timestamptz not null default now()` and `updated_at timestamptz not null default now()`
   - Money columns as `bigint` (minor units — sen for IDR, cents for USD) plus a `currency text not null` column when the column can hold either currency.
3. **Enable RLS and add owner policies**. Template:
   ```sql
   alter table public.<table> enable row level security;

   create policy "<table>_select_own"
     on public.<table> for select
     using (auth.uid() = user_id);

   create policy "<table>_insert_own"
     on public.<table> for insert
     with check (auth.uid() = user_id);

   create policy "<table>_update_own"
     on public.<table> for update
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   create policy "<table>_delete_own"
     on public.<table> for delete
     using (auth.uid() = user_id);
   ```
4. **Add indexes** for any column the app will filter or sort on (`user_id` always; plus `created_at`, `category_id`, etc.). Example:
   ```sql
   create index <table>_user_id_created_at_idx on public.<table> (user_id, created_at desc);
   ```
5. **Apply locally**:
   ```bash
   supabase db reset           # rebuild local DB from all migrations + seed
   ```
   or, to apply incrementally without losing data:
   ```bash
   supabase migration up
   ```
6. **Regenerate types** so feature `api.ts` files stay typed:
   ```bash
   supabase gen types typescript --local > src/lib/database.types.ts
   ```
7. Run `pnpm build` to confirm no type drift downstream.

## Conventions to enforce

- One logical change per migration file — never bundle unrelated tables or refactors.
- Every user-data table MUST have `enable row level security` and explicit per-action owner policies. There is no "RLS-disabled by default" exception in this project.
- Owner column is `user_id uuid references auth.users(id) on delete cascade`. Don't invent variants like `owner_id` or `account_id` for personal data.
- Currency columns store **minor units** as `bigint`. Never `numeric` or `float` for money.
- Migration filenames are immutable once committed — never rename or rewrite an applied migration. To fix a mistake, add a new migration that corrects it.
- Don't put seed data in migrations. Seeds go in `supabase/seed.sql`.

## Verification

- `supabase db reset` runs clean (no SQL errors).
- `supabase gen types typescript --local > src/lib/database.types.ts` succeeds and the diff shows the new table.
- `pnpm build` succeeds.
- In Supabase Studio (`http://127.0.0.1:54323`), inspect the table — confirm RLS is enabled (lock icon) and policies are listed.
- Manually test RLS: connect as one user, insert a row; switch user, attempt to select — should return zero rows.
