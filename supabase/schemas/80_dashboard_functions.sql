-- Dashboard read-side aggregations. RLS-aware via auth.uid().
--
-- p_rates: jsonb map of { CurrencyCode: rate-to-IDR }. The caller converts
-- each row's stored currency to the requested base by pivoting through IDR:
--   amount_in_base = amount * (p_rates ->> currency) / (p_rates ->> p_base)
-- Frozen / live rate source lives in src/lib/fx.ts.

create or replace function public.dashboard_monthly_summary(
  p_start_at timestamptz,
  p_end_at   timestamptz,
  p_base     text,
  p_rates    jsonb
) returns table (
  spent_total numeric,
  tier_fixed  numeric,
  tier_needs  numeric,
  tier_wants  numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with base_rate as (
    select (p_rates ->> p_base)::numeric as r
  ),
  converted as (
    select
      c.tier,
      e.amount * (p_rates ->> e.currency)::numeric / nullif((select r from base_rate), 0) as amount_base
    from public.expenses e
    left join public.categories c on c.id = e.category_id
    where e.user_id = (select auth.uid())
      and e.occurred_at >= p_start_at
      and e.occurred_at <  p_end_at
  )
  select
    coalesce(sum(amount_base), 0)                              as spent_total,
    coalesce(sum(amount_base) filter (where tier = 'fixed'), 0) as tier_fixed,
    coalesce(sum(amount_base) filter (where tier = 'needs'), 0) as tier_needs,
    coalesce(sum(amount_base) filter (where tier = 'wants'), 0) as tier_wants
  from converted;
$$;

grant execute on function public.dashboard_monthly_summary(timestamptz, timestamptz, text, jsonb)
  to authenticated;
