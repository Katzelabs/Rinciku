import type { PostgrestError } from '@supabase/supabase-js';
import type { Database, TypedSupabaseClient } from '@rinciku/db';
import type { CurrencyCode, RateMap } from '@rinciku/core';

import type {
  BudgetActuals,
  BudgetRow,
  TierBudgetRow,
  UpsertBudgetInput,
  UpsertTierBudgetInput,
} from './types';

type Result<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Budgets data layer: per-category targets, per-tier caps, and the
 * `budget_actuals` RPC for spend aggregation. The Supabase client is injected
 * so the same code runs against the web browser client and the native client.
 */
export function createBudgetsApi(db: TypedSupabaseClient) {
  // --- per-category budgets ------------------------------------------------

  async function listBudgets(
    year: number,
    month: number
  ): Promise<Result<BudgetRow[]>> {
    const { data, error } = await db
      .from('budgets')
      .select('*')
      .eq('period_year', year)
      .eq('period_month', month);
    return { data, error };
  }

  async function upsertBudget(
    input: UpsertBudgetInput
  ): Promise<Result<BudgetRow>> {
    const { data, error } = await db
      .from('budgets')
      .upsert(input, {
        onConflict: 'user_id,category_id,period_year,period_month',
      })
      .select('*')
      .single();
    return { data, error };
  }

  async function deleteBudget(id: string): Promise<Result<null>> {
    const { error } = await db.from('budgets').delete().eq('id', id);
    return { data: null, error };
  }

  // --- per-tier budgets ----------------------------------------------------

  async function listTierBudgets(
    year: number,
    month: number
  ): Promise<Result<TierBudgetRow[]>> {
    const { data, error } = await db
      .from('tier_budgets')
      .select('*')
      .eq('period_year', year)
      .eq('period_month', month);
    return { data, error };
  }

  async function upsertTierBudget(
    input: UpsertTierBudgetInput
  ): Promise<Result<TierBudgetRow>> {
    const { data, error } = await db
      .from('tier_budgets')
      .upsert(input, { onConflict: 'user_id,tier_id,period_year,period_month' })
      .select('*')
      .single();
    return { data, error };
  }

  async function deleteTierBudget(id: string): Promise<Result<null>> {
    const { error } = await db.from('tier_budgets').delete().eq('id', id);
    return { data: null, error };
  }

  // --- actuals (RPC) -------------------------------------------------------

  async function getBudgetActuals(
    start: string,
    end: string,
    base: CurrencyCode,
    rates: RateMap
  ): Promise<Result<BudgetActuals>> {
    const { data, error } = await db
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

  // --- copy from previous period -------------------------------------------

  // Seeds the target period from the previous one by re-upserting every category
  // budget and tier cap. Existing rows in the target period are overwritten
  // (upsert on the unique key). Returns the count copied.
  async function copyFromPreviousPeriod(
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
      const { error } = await db.from('budgets').upsert(budgetRows, {
        onConflict: 'user_id,category_id,period_year,period_month',
      });
      if (error) return { data: null, error };
    }
    if (tierRows.length > 0) {
      const { error } = await db.from('tier_budgets').upsert(tierRows, {
        onConflict: 'user_id,tier_id,period_year,period_month',
      });
      if (error) return { data: null, error };
    }

    return {
      data: { budgets: budgetRows.length, tierBudgets: tierRows.length },
      error: null,
    };
  }

  return {
    listBudgets,
    upsertBudget,
    deleteBudget,
    listTierBudgets,
    upsertTierBudget,
    deleteTierBudget,
    getBudgetActuals,
    copyFromPreviousPeriod,
  };
}

export type BudgetsApi = ReturnType<typeof createBudgetsApi>;

function parseJsonMap(raw: unknown): Record<string, number> {
  const map: Record<string, number> = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [id, amount] of Object.entries(raw as Record<string, unknown>)) {
      map[id] = Number(amount ?? 0);
    }
  }
  return map;
}

function previousPeriod(
  year: number,
  month: number
): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}
