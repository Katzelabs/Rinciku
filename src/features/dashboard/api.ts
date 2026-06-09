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
import type { CategoryTier } from '@/features/categories/hooks/use-categories';
import { listEssentials } from '@/features/essentials/api';
import { computeBaseline } from '@/features/essentials/lib/baseline';

export type TierTotals = Record<CategoryTier, number>;

export type MonthlySummary = {
  cycle: Cycle;
  base_currency: CurrencyCode;
  income_total: number;
  spent_total: number;
  remaining: number;
  days_left: number;
  baseline_total: number;
  baseline_uncovered: number;
  by_tier: TierTotals;
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

  const [summaryRes, essentialsRes] = await Promise.all([
    supabase
      .rpc('dashboard_monthly_summary', {
        p_start_at: cycle.start.toISOString(),
        p_end_at: endExclusive,
        p_base: base,
        p_rates: getCurrentRates(),
      })
      .single(),
    listEssentials(),
  ]);

  if (summaryRes.error) return { data: null, error: summaryRes.error };
  if (essentialsRes.error) return { data: null, error: essentialsRes.error };

  const by_tier: TierTotals = {
    fixed: round2(Number(summaryRes.data.tier_fixed ?? 0)),
    needs: round2(Number(summaryRes.data.tier_needs ?? 0)),
    wants: round2(Number(summaryRes.data.tier_wants ?? 0)),
  };
  const spent_total = round2(Number(summaryRes.data.spent_total ?? 0));

  const income_total = round2(
    convertToBase(
      Number(profile.expected_monthly_income ?? 0),
      (profile.expected_monthly_income_currency ?? 'IDR') as CurrencyCode,
      base
    ).amount_base
  );

  const baseline = computeBaseline(essentialsRes.data ?? [], base);
  const baseline_total = baseline.total_base;
  const essentialsSpent = by_tier.fixed + by_tier.needs;
  const baseline_uncovered = round2(
    Math.max(0, baseline_total - essentialsSpent)
  );

  const remaining = round2(income_total - spent_total);
  const days_left = getDaysLeft(cycle, now);

  return {
    data: {
      cycle,
      base_currency: base,
      income_total,
      spent_total,
      remaining,
      days_left,
      baseline_total,
      baseline_uncovered,
      by_tier,
    },
    error: null,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
