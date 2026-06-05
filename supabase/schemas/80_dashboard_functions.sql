-- Dashboard read-side aggregations. RLS-aware via auth.uid().

create or replace function public.dashboard_monthly_summary(
  start_at timestamptz,
  end_at   timestamptz
) returns table (
  spent_idr_total numeric,
  tier_fixed_idr  numeric,
  tier_needs_idr  numeric,
  tier_wants_idr  numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(e.amount_idr), 0)                                 as spent_idr_total,
    coalesce(sum(e.amount_idr) filter (where c.tier = 'fixed'), 0) as tier_fixed_idr,
    coalesce(sum(e.amount_idr) filter (where c.tier = 'needs'), 0) as tier_needs_idr,
    coalesce(sum(e.amount_idr) filter (where c.tier = 'wants'), 0) as tier_wants_idr
  from public.expenses e
  left join public.categories c on c.id = e.category_id
  where e.user_id = (select auth.uid())
    and e.occurred_at >= start_at
    and e.occurred_at <  end_at;
$$;

grant execute on function public.dashboard_monthly_summary(timestamptz, timestamptz)
  to authenticated;
