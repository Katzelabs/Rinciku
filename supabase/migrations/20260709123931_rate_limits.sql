
  create table "public"."rate_limit_hits" (
    "user_id" uuid not null,
    "bucket" text not null,
    "window_start" timestamp with time zone not null,
    "hits" integer not null default 1
      );


alter table "public"."rate_limit_hits" enable row level security;

CREATE UNIQUE INDEX rate_limit_hits_pkey ON public.rate_limit_hits USING btree (user_id, bucket, window_start);

alter table "public"."rate_limit_hits" add constraint "rate_limit_hits_pkey" PRIMARY KEY using index "rate_limit_hits_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_bucket text, p_max_hits integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

grant delete on table "public"."rate_limit_hits" to "authenticated";

grant insert on table "public"."rate_limit_hits" to "authenticated";

grant select on table "public"."rate_limit_hits" to "authenticated";

grant update on table "public"."rate_limit_hits" to "authenticated";

grant delete on table "public"."rate_limit_hits" to "service_role";

grant insert on table "public"."rate_limit_hits" to "service_role";

grant references on table "public"."rate_limit_hits" to "service_role";

grant select on table "public"."rate_limit_hits" to "service_role";

grant trigger on table "public"."rate_limit_hits" to "service_role";

grant truncate on table "public"."rate_limit_hits" to "service_role";

grant update on table "public"."rate_limit_hits" to "service_role";


