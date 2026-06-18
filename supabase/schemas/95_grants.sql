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

grant select, insert, update, delete
  on all tables in schema public
  to anon, authenticated, service_role;

grant usage, select
  on all sequences in schema public
  to anon, authenticated, service_role;

-- Apply the same defaults to any tables/sequences created later by postgres.
alter default privileges in schema public
  grant select, insert, update, delete on tables
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences
  to anon, authenticated, service_role;
