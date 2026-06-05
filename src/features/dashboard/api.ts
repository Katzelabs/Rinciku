import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getFxRate } from '@/lib/fx';
import { getCurrentCycle, getDaysLeft, type Cycle } from '@/lib/cycle';
import type { Profile } from '@/features/auth';
import type { CategoryTier } from '@/features/categories/hooks/use-categories';
import { listEssentials } from '@/features/essentials/api';
import { computeBaseline } from '@/features/essentials/lib/baseline';

export type TierTotals = Record<CategoryTier, number>;

export type MonthlySummary = {
  cycle: Cycle;
  income_idr_total: number;
  spent_idr_total: number;
  remaining_idr: number;
  days_left: number;
  baseline_idr: number;
  baseline_uncovered_idr: number;
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

  const [fxRate, summaryRes, essentialsRes] = await Promise.all([
    getFxRate('USD', 'IDR'),
    supabase
      .rpc('dashboard_monthly_summary', {
        start_at: cycle.start.toISOString(),
        end_at: endExclusive,
      })
      .single(),
    listEssentials(),
  ]);

  if (summaryRes.error) return { data: null, error: summaryRes.error };
  if (essentialsRes.error) return { data: null, error: essentialsRes.error };

  const by_tier: TierTotals = {
    fixed: round2(Number(summaryRes.data.tier_fixed_idr ?? 0)),
    needs: round2(Number(summaryRes.data.tier_needs_idr ?? 0)),
    wants: round2(Number(summaryRes.data.tier_wants_idr ?? 0)),
  };
  const spent_idr_total = round2(Number(summaryRes.data.spent_idr_total ?? 0));

  const income_idr_total = round2(
    Number(profile.monthly_income_idr ?? 0) +
      Number(profile.monthly_income_usd ?? 0) * fxRate
  );

  const baseline = computeBaseline(essentialsRes.data ?? [], fxRate);
  const baseline_idr = baseline.total_idr;
  const essentialsSpent = by_tier.fixed + by_tier.needs;
  const baseline_uncovered_idr = round2(
    Math.max(0, baseline_idr - essentialsSpent)
  );

  const remaining_idr = round2(income_idr_total - spent_idr_total);
  const days_left = getDaysLeft(cycle, now);

  return {
    data: {
      cycle,
      income_idr_total,
      spent_idr_total,
      remaining_idr,
      days_left,
      baseline_idr,
      baseline_uncovered_idr,
      by_tier,
    },
    error: null,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
