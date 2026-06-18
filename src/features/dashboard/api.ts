import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  convertToBase,
  ensureRates,
  getCurrentRates,
  type CurrencyCode,
} from '@/lib/fx';
import { getCurrentCycle, getDaysLeft, type Cycle } from '@/lib/cycle';
import type { Profile } from '@/features/auth';
import { listTiers } from '@/features/categories/api';
import type { Tier } from '@/features/categories/hooks/use-categories';
import { listEssentials } from '@/features/essentials/api';
import { computeBaseline } from '@/features/essentials/lib/baseline';

// Spend per tier, keyed by tier id (matches the SQL `by_tier` jsonb map).
export type TierTotals = Record<string, number>;

export type MonthlySummary = {
  cycle: Cycle;
  base_currency: CurrencyCode;
  expected_monthly_income: number;
  income_received: number;
  spent_total: number;
  remaining: number;
  days_left: number;
  baseline_total: number;
  baseline_uncovered: number;
  by_tier: TierTotals;
  uncategorized_spent: number;
  tiers: Tier[];
};

type Result<T> = {
  data: T | null;
  error: PostgrestError | Error | null;
};

export async function getMonthlySummary(
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
    supabase
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
