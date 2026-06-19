-- Dashboard read-side aggregations. RLS-aware via auth.uid().
--
-- p_rates: jsonb map of { CurrencyCode: rate-to-IDR }. The caller converts
-- each row's stored currency to the requested base by pivoting through IDR:
--   amount_in_base = amount * (p_rates ->> currency) / (p_rates ->> p_base)
-- Frozen / live rate source lives in src/lib/fx.ts.

-- Returns spend aggregated per user-defined tier (by_tier: { tier_id::text :
-- amount_base }), plus an essentials_spent roll-up (tiers flagged is_essential)
-- and uncategorized_spent (expenses with no category / no tier).
create or replace function public.dashboard_monthly_summary(
  p_start_at timestamptz,
  p_end_at   timestamptz,
  p_base     text,
  p_rates    jsonb
) returns table (
  spent_total                numeric,
  by_tier                    jsonb,
  essentials_spent           numeric,
  uncategorized_spent        numeric,
  income_received_this_cycle numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with base_rate as (
    select (p_rates ->> p_base)::numeric as r
  ),
  converted_expenses as (
    select
      c.tier_id,
      t.is_essential,
      e.amount * (p_rates ->> e.currency)::numeric / nullif((select r from base_rate), 0) as amount_base
    from public.expenses e
    left join public.categories c on c.id = e.category_id
    left join public.tiers t      on t.id = c.tier_id
    where e.user_id = (select auth.uid())
      and e.occurred_at >= p_start_at
      and e.occurred_at <  p_end_at
  ),
  converted_incomes as (
    select
      i.amount * (p_rates ->> i.currency)::numeric / nullif((select r from base_rate), 0) as amount_base
    from public.incomes i
    where i.user_id = (select auth.uid())
      and i.occurred_at >= p_start_at
      and i.occurred_at <  p_end_at
  ),
  per_tier as (
    select tier_id, sum(amount_base) as amount_base
    from converted_expenses
    where tier_id is not null
    group by tier_id
  ),
  expense_aggs as (
    select
      coalesce((select sum(amount_base) from converted_expenses), 0)                                  as spent_total,
      coalesce((select sum(amount_base) from converted_expenses where is_essential), 0)               as essentials_spent,
      coalesce((select sum(amount_base) from converted_expenses where tier_id is null), 0)            as uncategorized_spent,
      coalesce((select jsonb_object_agg(tier_id::text, amount_base) from per_tier), '{}'::jsonb)      as by_tier
  ),
  income_aggs as (
    select coalesce(sum(amount_base), 0) as income_received_this_cycle
    from converted_incomes
  )
  select
    e.spent_total,
    e.by_tier,
    e.essentials_spent,
    e.uncategorized_spent,
    i.income_received_this_cycle
  from expense_aggs e, income_aggs i;
$$;

grant execute on function public.dashboard_monthly_summary(timestamptz, timestamptz, text, jsonb)
  to authenticated;

-- Per-category and per-tier spend for the window, FX-converted to p_base using
-- the same pivot-through-IDR math as dashboard_monthly_summary. The dashboard
-- summary only exposes by_tier; the budgets feature also needs by_category to
-- compare against per-category targets. Both maps key amounts by id::text.
create or replace function public.budget_actuals(
  p_start_at timestamptz,
  p_end_at   timestamptz,
  p_base     text,
  p_rates    jsonb
) returns table (
  by_category jsonb,
  by_tier     jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  with base_rate as (
    select (p_rates ->> p_base)::numeric as r
  ),
  converted_expenses as (
    select
      e.category_id,
      c.tier_id,
      e.amount * (p_rates ->> e.currency)::numeric / nullif((select r from base_rate), 0) as amount_base
    from public.expenses e
    left join public.categories c on c.id = e.category_id
    where e.user_id = (select auth.uid())
      and e.occurred_at >= p_start_at
      and e.occurred_at <  p_end_at
  ),
  per_category as (
    select category_id, sum(amount_base) as amount_base
    from converted_expenses
    where category_id is not null
    group by category_id
  ),
  per_tier as (
    select tier_id, sum(amount_base) as amount_base
    from converted_expenses
    where tier_id is not null
    group by tier_id
  )
  select
    coalesce((select jsonb_object_agg(category_id::text, amount_base) from per_category), '{}'::jsonb) as by_category,
    coalesce((select jsonb_object_agg(tier_id::text, amount_base) from per_tier), '{}'::jsonb)         as by_tier;
$$;

grant execute on function public.budget_actuals(timestamptz, timestamptz, text, jsonb)
  to authenticated;
