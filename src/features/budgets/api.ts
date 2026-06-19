import type { PostgrestError } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/database.types';
import type { CurrencyCode, RateMap } from '@/lib/fx';
import { supabase } from '@/lib/supabase';

type BudgetRow = Tables<'budgets'>;
type TierBudgetRow = Tables<'tier_budgets'>;

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

// Targets are written in the user's base currency in effect at write time,
// mirroring expenses/essentials. Aggregations convert back at read time.
export type UpsertBudgetInput = {
  user_id: string;
  category_id: string;
  period_year: number;
  period_month: number;
  amount: number;
  currency: CurrencyCode;
};

export type UpsertTierBudgetInput = {
  user_id: string;
  tier_id: string;
  period_year: number;
  period_month: number;
  amount: number;
  currency: CurrencyCode;
};

// jsonb maps keyed by id::text → spend in base currency.
export type BudgetActuals = {
  by_category: Record<string, number>;
  by_tier: Record<string, number>;
};

// --- per-category budgets --------------------------------------------------

export async function listBudgets(
  year: number,
  month: number
): Promise<Result<BudgetRow[]>> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('period_year', year)
    .eq('period_month', month);
  return { data, error };
}

export async function upsertBudget(
  input: UpsertBudgetInput
): Promise<Result<BudgetRow>> {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(input, {
      onConflict: 'user_id,category_id,period_year,period_month',
    })
    .select('*')
    .single();
  return { data, error };
}

export async function deleteBudget(id: string): Promise<Result<null>> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  return { data: null, error };
}

// --- per-tier budgets ------------------------------------------------------

export async function listTierBudgets(
  year: number,
  month: number
): Promise<Result<TierBudgetRow[]>> {
  const { data, error } = await supabase
    .from('tier_budgets')
    .select('*')
    .eq('period_year', year)
    .eq('period_month', month);
  return { data, error };
}

export async function upsertTierBudget(
  input: UpsertTierBudgetInput
): Promise<Result<TierBudgetRow>> {
  const { data, error } = await supabase
    .from('tier_budgets')
    .upsert(input, { onConflict: 'user_id,tier_id,period_year,period_month' })
    .select('*')
    .single();
  return { data, error };
}

export async function deleteTierBudget(id: string): Promise<Result<null>> {
  const { error } = await supabase.from('tier_budgets').delete().eq('id', id);
  return { data: null, error };
}

// --- actuals (RPC) ---------------------------------------------------------

export async function getBudgetActuals(
  start: string,
  end: string,
  base: CurrencyCode,
  rates: RateMap
): Promise<Result<BudgetActuals>> {
  const { data, error } = await supabase
    .rpc('budget_actuals', {
      p_start_at: start,
      p_end_at: end,
      p_base: base,
      p_rates:
        rates as unknown as Database['public']['Functions']['budget_actuals']['Args']['p_rates'],
    })
    .single();
  if (error || !data) {
    return { data: null, error };
  }
  return {
    data: {
      by_category: parseJsonMap(data.by_category),
      by_tier: parseJsonMap(data.by_tier),
    },
    error: null,
  };
}

function parseJsonMap(raw: unknown): Record<string, number> {
  const map: Record<string, number> = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [id, amount] of Object.entries(raw as Record<string, unknown>)) {
      map[id] = Number(amount ?? 0);
    }
  }
  return map;
}

// --- copy from previous period ---------------------------------------------

function previousPeriod(
  year: number,
  month: number
): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

// Seeds the target period from the previous one by re-upserting every category
// budget and tier cap. Existing rows in the target period are overwritten
// (upsert on the unique key). Returns the count copied.
export async function copyFromPreviousPeriod(
  year: number,
  month: number
): Promise<Result<{ budgets: number; tierBudgets: number }>> {
  const prev = previousPeriod(year, month);

  const [prevBudgets, prevTierBudgets] = await Promise.all([
    listBudgets(prev.year, prev.month),
    listTierBudgets(prev.year, prev.month),
  ]);
  if (prevBudgets.error) return { data: null, error: prevBudgets.error };
  if (prevTierBudgets.error)
    return { data: null, error: prevTierBudgets.error };

  const budgetRows = (prevBudgets.data ?? []).map((b) => ({
    user_id: b.user_id,
    category_id: b.category_id,
    period_year: year,
    period_month: month,
    amount: b.amount,
    currency: b.currency,
  }));
  const tierRows = (prevTierBudgets.data ?? []).map((b) => ({
    user_id: b.user_id,
    tier_id: b.tier_id,
    period_year: year,
    period_month: month,
    amount: b.amount,
    currency: b.currency,
  }));

  if (budgetRows.length > 0) {
    const { error } = await supabase.from('budgets').upsert(budgetRows, {
      onConflict: 'user_id,category_id,period_year,period_month',
    });
    if (error) return { data: null, error };
  }
  if (tierRows.length > 0) {
    const { error } = await supabase.from('tier_budgets').upsert(tierRows, {
      onConflict: 'user_id,tier_id,period_year,period_month',
    });
    if (error) return { data: null, error };
  }

  return {
    data: { budgets: budgetRows.length, tierBudgets: tierRows.length },
    error: null,
  };
}
