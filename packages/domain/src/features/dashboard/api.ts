import type { PostgrestError } from '@supabase/supabase-js';
import type { TypedSupabaseClient } from '@rinciku/db';
import {
  convertToBase,
  ensureRates,
  getCurrentCycle,
  getCurrentRates,
  getDaysLeft,
  type CurrencyCode,
} from '@rinciku/core';

import type { Profile } from '../auth';
import { createCategoriesApi } from '../categories';
import { createEssentialsApi, computeBaseline } from '../essentials';
import type { MonthlySummary, PeriodSpend, TierTotals } from './types';

type Result<T> = {
  data: T | null;
  error: PostgrestError | Error | null;
};

/**
 * Dashboard aggregation layer. The Supabase client is injected so the same code
 * runs against the web browser client and the native client. Only the
 * current-cycle summary is portable today; the filterable analytics charts stay
 * web-local (they depend on the not-yet-extracted budgets feature).
 */
export function createDashboardApi(db: TypedSupabaseClient) {
  const { listEssentials } = createEssentialsApi(db);
  const { listTiers } = createCategoriesApi(db);

  async function getMonthlySummary(
    profile: Profile,
    now: Date = new Date()
  ): Promise<Result<MonthlySummary>> {
    const cycle = getCurrentCycle(profile, now);
    // cycle.end is the inclusive last instant (nextStart - 1ms); the RPC window
    // is half-open [start, end), so pass nextStart as the exclusive upper bound.
    const endExclusive = new Date(cycle.end.getTime() + 1).toISOString();
    const base = (profile.base_currency ?? 'IDR') as CurrencyCode;

    await ensureRates();

    const [summaryRes, essentialsRes, tiersRes] = await Promise.all([
      db
        .rpc('dashboard_monthly_summary', {
          p_start_at: cycle.start.toISOString(),
          p_end_at: endExclusive,
          p_base: base,
          p_rates: getCurrentRates(),
        })
        .single(),
      listEssentials(),
      listTiers(),
    ]);

    if (summaryRes.error) return { data: null, error: summaryRes.error };
    if (essentialsRes.error) return { data: null, error: essentialsRes.error };
    if (tiersRes.error) return { data: null, error: tiersRes.error };

    const by_tier = parseTierTotals(summaryRes.data.by_tier);
    const spent_total = round2(Number(summaryRes.data.spent_total ?? 0));
    const essentials_spent = round2(
      Number(summaryRes.data.essentials_spent ?? 0)
    );
    const uncategorized_spent = round2(
      Number(summaryRes.data.uncategorized_spent ?? 0)
    );

    const expected_monthly_income = round2(
      convertToBase(
        Number(profile.expected_monthly_income ?? 0),
        (profile.expected_monthly_income_currency ?? 'IDR') as CurrencyCode,
        base
      ).amount_base
    );

    const income_received = round2(
      Number(summaryRes.data.income_received_this_cycle ?? 0)
    );

    const baseline = computeBaseline(essentialsRes.data ?? [], base);
    const baseline_total = baseline.total_base;
    const baseline_uncovered = round2(
      Math.max(0, baseline_total - essentials_spent)
    );

    const remaining = round2(expected_monthly_income - spent_total);
    const days_left = getDaysLeft(cycle, now);

    return {
      data: {
        cycle,
        base_currency: base,
        expected_monthly_income,
        income_received,
        spent_total,
        remaining,
        days_left,
        baseline_total,
        baseline_uncovered,
        by_tier,
        uncategorized_spent,
        tiers: tiersRes.data ?? [],
      },
      error: null,
    };
  }

  // Spend total + by-tier breakdown for an arbitrary [from, to] window (the RPC
  // window is half-open, so pass `to + 1ms` as the exclusive upper bound like
  // getMonthlySummary does). Powers the dashboard's period picker without
  // touching the monthly budget cards.
  async function getPeriodSpend(
    profile: Profile,
    from: Date,
    to: Date
  ): Promise<Result<PeriodSpend>> {
    const base = (profile.base_currency ?? 'IDR') as CurrencyCode;
    const endExclusive = new Date(to.getTime() + 1).toISOString();

    await ensureRates();

    const res = await db
      .rpc('dashboard_monthly_summary', {
        p_start_at: from.toISOString(),
        p_end_at: endExclusive,
        p_base: base,
        p_rates: getCurrentRates(),
      })
      .single();

    if (res.error) return { data: null, error: res.error };

    return {
      data: {
        base_currency: base,
        spent_total: round2(Number(res.data.spent_total ?? 0)),
        by_tier: parseTierTotals(res.data.by_tier),
        uncategorized_spent: round2(Number(res.data.uncategorized_spent ?? 0)),
      },
      error: null,
    };
  }

  return { getMonthlySummary, getPeriodSpend };
}

export type DashboardApi = ReturnType<typeof createDashboardApi>;

// The SQL function returns by_tier as a jsonb map { tier_id: amount }.
function parseTierTotals(raw: unknown): TierTotals {
  const totals: TierTotals = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [tierId, amount] of Object.entries(raw)) {
      totals[tierId] = round2(Number(amount ?? 0));
    }
  }
  return totals;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
