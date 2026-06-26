import { useEffect, useState } from 'react';
import type { Profile } from '@/features/auth';
import { getBudgetVsActual, getCategoryBreakdown, getSpendTrend } from '../api';
import type {
  AnalyticsFilters,
  BudgetComparisonItem,
  CategoryBreakdown,
  TrendPoint,
} from '../types';

export type AnalyticsData = {
  trend: TrendPoint[];
  breakdown: CategoryBreakdown;
  budget: BudgetComparisonItem[];
};

type State = {
  key: string;
  data: AnalyticsData | null;
  error: string | null;
};

export type UseAnalyticsResult = {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
};

// Fetches all three analytics queries in parallel whenever the filters change,
// with a cancel guard so a stale response can't clobber a newer one. The effect
// depends on primitive filter values (not the object identity, which churns each
// render) and rebuilds the filters inside, so it only refetches on real changes.
export function useAnalytics(
  profile: Profile | null,
  filters: AnalyticsFilters
): UseAnalyticsResult {
  const fromMs = filters.from.getTime();
  const toMs = filters.to.getTime();
  const catKey = filters.categoryIds.join(',');
  const key = profile ? `${profile.id}:${fromMs}:${toMs}:${catKey}` : '';
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const current: AnalyticsFilters = {
      from: new Date(fromMs),
      to: new Date(toMs),
      categoryIds: catKey ? catKey.split(',') : [],
    };

    Promise.all([
      getSpendTrend(profile, current),
      getCategoryBreakdown(profile, current),
      getBudgetVsActual(profile, current),
    ])
      .then(([trendRes, breakdownRes, budgetRes]) => {
        if (cancelled) return;
        const error =
          trendRes.error ?? breakdownRes.error ?? budgetRes.error ?? null;
        setState({
          key,
          data: error
            ? null
            : {
                trend: trendRes.data ?? [],
                breakdown: breakdownRes.data ?? { byCategory: [], byTier: [] },
                budget: budgetRes.data ?? [],
              },
          error: error?.message ?? null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          key,
          data: null,
          error:
            err instanceof Error ? err.message : 'Failed to load analytics.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [profile, key, fromMs, toMs, catKey]);

  return {
    data: state?.key === key ? state.data : null,
    loading: !profile || state?.key !== key,
    error: state?.key === key ? state.error : null,
  };
}
