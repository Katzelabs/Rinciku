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
import { listCategories, listTiers } from '@/features/categories/api';
import type { Tier } from '@/features/categories/hooks/use-categories';
import { listEssentials } from '@/features/essentials/api';
import { computeBaseline } from '@/features/essentials/lib/baseline';
import { getBudgetActuals, listBudgets } from '@/features/budgets/api';
import {
  bucketKey,
  enumerateBuckets,
  formatBucketLabel,
  monthsInRange,
  pickBucket,
} from './lib/buckets';
import type {
  AnalyticsFilters,
  BudgetComparisonItem,
  CategoryBreakdown,
  TrendPoint,
} from './types';

// Fallback slice color, matching tier-breakdown's UNTIERED_COLOR.
const FALLBACK_COLOR = '#94a3b8';

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

// --- analytics (filterable charts) -----------------------------------------

function baseOf(profile: Profile): CurrencyCode {
  return (profile.base_currency ?? 'IDR') as CurrencyCode;
}

// The picker's `to` is the inclusive last instant (23:59:59.999); the RPCs want
// a half-open [start, end) window, so add 1ms for the exclusive upper bound.
function endExclusive(to: Date): string {
  return new Date(to.getTime() + 1).toISOString();
}

// Spend + income bucketed over the range. Serves both the spending-trend and
// income-vs-expense charts. Gaps the RPC omits are zero-filled here.
export async function getSpendTrend(
  profile: Profile,
  filters: AnalyticsFilters
): Promise<Result<TrendPoint[]>> {
  const base = baseOf(profile);
  const bucket = pickBucket(filters.from, filters.to);
  await ensureRates();

  const { data, error } = await supabase.rpc('dashboard_time_series', {
    p_start_at: filters.from.toISOString(),
    p_end_at: endExclusive(filters.to),
    p_base: base,
    p_rates: getCurrentRates(),
    p_bucket: bucket,
    p_category_ids:
      filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
  });
  if (error) return { data: null, error };

  const byKey = new Map<string, { spent: number; income: number }>();
  for (const row of data ?? []) {
    byKey.set(row.bucket, {
      spent: round2(Number(row.spent ?? 0)),
      income: round2(Number(row.income ?? 0)),
    });
  }

  const points: TrendPoint[] = enumerateBuckets(
    filters.from,
    filters.to,
    bucket
  ).map((date) => {
    const key = bucketKey(date);
    const value = byKey.get(key);
    return {
      bucket: key,
      label: formatBucketLabel(date, bucket),
      spent: value?.spent ?? 0,
      income: value?.income ?? 0,
    };
  });

  return { data: points, error: null };
}

// Spend grouped by category and by tier for the range. Reuses budget_actuals
// for the per-category totals; the per-tier totals are derived from those so the
// category filter applies consistently to both charts.
export async function getCategoryBreakdown(
  profile: Profile,
  filters: AnalyticsFilters
): Promise<Result<CategoryBreakdown>> {
  const base = baseOf(profile);
  await ensureRates();

  const [actualsRes, catsRes, tiersRes] = await Promise.all([
    getBudgetActuals(
      filters.from.toISOString(),
      endExclusive(filters.to),
      base,
      getCurrentRates()
    ),
    listCategories(),
    listTiers(),
  ]);
  if (actualsRes.error) return { data: null, error: actualsRes.error };
  if (catsRes.error) return { data: null, error: catsRes.error };
  if (tiersRes.error) return { data: null, error: tiersRes.error };

  const byCategoryMap = actualsRes.data?.by_category ?? {};
  const cats = catsRes.data ?? [];
  const tiers = tiersRes.data ?? [];
  const selected = new Set(filters.categoryIds);
  const visible = cats.filter(
    (c) => selected.size === 0 || selected.has(c.id)
  );

  const byCategory = visible
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color ?? FALLBACK_COLOR,
      amount: round2(byCategoryMap[c.id] ?? 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const tierTotals = new Map<string, number>();
  for (const c of visible) {
    if (!c.tier_id) continue;
    tierTotals.set(
      c.tier_id,
      (tierTotals.get(c.tier_id) ?? 0) + (byCategoryMap[c.id] ?? 0)
    );
  }
  const byTier = tiers
    .map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color ?? FALLBACK_COLOR,
      amount: round2(tierTotals.get(t.id) ?? 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return { data: { byCategory, byTier }, error: null };
}

// Per-category budget target vs actual spend. Targets are summed across every
// month the range covers (budget-vs-actual is month-granular by design) and
// FX-converted from their stored currency to the base.
export async function getBudgetVsActual(
  profile: Profile,
  filters: AnalyticsFilters
): Promise<Result<BudgetComparisonItem[]>> {
  const base = baseOf(profile);
  await ensureRates();

  const months = monthsInRange(filters.from, filters.to);
  const [actualsRes, catsRes, ...budgetResults] = await Promise.all([
    getBudgetActuals(
      filters.from.toISOString(),
      endExclusive(filters.to),
      base,
      getCurrentRates()
    ),
    listCategories(),
    ...months.map((m) => listBudgets(m.year, m.month)),
  ]);
  if (actualsRes.error) return { data: null, error: actualsRes.error };
  if (catsRes.error) return { data: null, error: catsRes.error };
  const budgetErr = budgetResults.find((r) => r.error)?.error;
  if (budgetErr) return { data: null, error: budgetErr };

  const actuals = actualsRes.data?.by_category ?? {};
  const cats = catsRes.data ?? [];
  const selected = new Set(filters.categoryIds);

  const targetByCategory = new Map<string, number>();
  for (const row of budgetResults.flatMap((r) => r.data ?? [])) {
    const { amount_base } = convertToBase(
      Number(row.amount),
      row.currency as CurrencyCode,
      base
    );
    targetByCategory.set(
      row.category_id,
      (targetByCategory.get(row.category_id) ?? 0) + amount_base
    );
  }

  const items = cats
    .filter((c) => selected.size === 0 || selected.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color ?? FALLBACK_COLOR,
      target: round2(targetByCategory.get(c.id) ?? 0),
      actual: round2(actuals[c.id] ?? 0),
    }))
    .filter((item) => item.target > 0 || item.actual > 0)
    .sort((a, b) => b.actual - a.actual);

  return { data: items, error: null };
}
