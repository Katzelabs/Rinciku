-- §grants
-- Table-level privileges for the Supabase API roles. RLS still gates row access;
-- these grants are the coarse table-level permission the API role needs before
-- RLS policies are even evaluated.
--
-- Why this file exists: `supabase db diff` does not reliably reproduce the
-- DML grants that Supabase's default privileges apply, so a regenerated rolling
-- init can silently drop `select/insert/update/delete` for `authenticated`,
-- producing "permission denied for table ..." (SQLSTATE 42501). Declaring the
-- grants here keeps them in the generated migration across regenerations.
-- Must load after every table is created (see schema_paths order).
--
-- `anon` gets NO table access: the app only ever queries as `authenticated`,
-- and leaving anon DML in place would make RLS the sole barrier (one forgotten
-- `enable row level security` on a future table = world-readable data). The
-- explicit revokes below are required because the platform's default ACL
-- grants truncate/references/trigger/maintain to every API role on each
-- CREATE TABLE — editing the grants above them is not sufficient. Schema
-- `usage` for anon is intentionally kept (PostgREST introspection needs it).
--
-- IMPORTANT: `supabase db diff` cannot emit `revoke` / `alter default
-- privileges` statements, so the revokes below never reach a generated
-- migration. Their applied twin is the hand-maintained migration
-- `supabase/migrations/20260101000000_role_privileges.sql`, which sorts
-- before the rolling init. Keep the two in sync; keep that migration when
-- regenerating the init.

grant select, insert, update, delete
  on all tables in schema public
  to authenticated, service_role;

grant usage, select
  on all sequences in schema public
  to authenticated, service_role;

-- Apply the same defaults to any tables/sequences created later by postgres.
alter default privileges in schema public
  grant select, insert, update, delete on tables
  to authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences
  to authenticated, service_role;

-- Strip what the platform defaults over-granted: anon everything, and
-- non-RLS-gated privileges (truncate is not gated by RLS!) for authenticated.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke truncate, references, trigger, maintain on all tables in schema public from authenticated;

alter default privileges in schema public
  revoke all on tables from anon;

alter default privileges in schema public
  revoke all on sequences from anon;

alter default privileges in schema public
  revoke truncate, references, trigger, maintain on tables from authenticated;
