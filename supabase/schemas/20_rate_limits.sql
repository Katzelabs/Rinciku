-- §rate_limits
-- Fixed-window per-user rate limiting, used by edge functions (ai-chat) to
-- throttle abuse. Callers invoke check_rate_limit() through the user-scoped
-- client: the user id comes from auth.uid() inside the function, so it cannot
-- be spoofed by the caller.

create table public.rate_limit_hits (
  user_id uuid not null,
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (user_id, bucket, window_start)
);

-- RLS on with no policies: nothing reads or writes this table except the
-- security definer function below.
alter table public.rate_limit_hits enable row level security;

-- Returns true while the caller is within p_max_hits for the current
-- fixed window of p_window_seconds; false once over (or unauthenticated).
create or replace function public.check_rate_limit(
  p_bucket text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_window timestamptz;
  v_hits integer;
begin
  if v_user is null then
    return false;
  end if;

  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_hits as r (user_id, bucket, window_start)
  values (v_user, p_bucket, v_window)
  on conflict (user_id, bucket, window_start)
  do update set hits = r.hits + 1
  returning r.hits into v_hits;

  -- Opportunistic cleanup: drop this user/bucket's expired windows so the
  -- table stays small without a scheduled job.
  delete from public.rate_limit_hits
  where user_id = v_user
    and bucket = p_bucket
    and window_start < v_window;

  return v_hits <= p_max_hits;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated, service_role;
