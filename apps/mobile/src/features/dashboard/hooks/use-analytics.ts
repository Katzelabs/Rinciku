import { useCallback, useEffect, useState } from 'react';
import { ensureRates } from '@rinciku/core';
import type {
  BudgetComparisonItem,
  CategoryBreakdown,
  TrendPoint,
} from '@rinciku/domain/dashboard';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  getBudgetVsActual,
  getCategoryBreakdown,
  getSpendTrend,
} from '@/features/dashboard/api';

export type AnalyticsData = {
  trend: TrendPoint[];
  breakdown: CategoryBreakdown;
  budget: BudgetComparisonItem[];
};

type FetchState = {
  key: string;
  data: AnalyticsData | null;
  error: string | null;
};

// Loads the range-scoped analytics (spend trend, category/tier breakdown, and
// budget-vs-actual) for the dashboard's period picker. The three queries run in
// parallel after `ensureRates()` so their base-currency conversions use live
// rates. Keyed by `profileId:from:to:token` so changing the period auto-refetches
// and stale responses can't clobber a newer one. Loading is derived from the
// query key so it stays true across refetches.
export function useAnalytics(from: Date, to: Date) {
  const { profile } = useAuth();
  const [token, setToken] = useState(0);
  const [state, setState] = useState<FetchState | null>(null);

  const queryKey = profile
    ? `${profile.id}:${from.toISOString()}:${to.toISOString()}:${token}`
    : '';

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    // The dashboard period picker has no category filter, so the range covers
    // every category.
    const filters = { from, to, categoryIds: [] as string[] };
    void (async () => {
      await ensureRates();
      const [trendRes, breakdownRes, budgetRes] = await Promise.all([
        getSpendTrend(profile, filters),
        getCategoryBreakdown(profile, filters),
        getBudgetVsActual(profile, filters),
      ]);
      if (cancelled) return;
      const error =
        trendRes.error ?? breakdownRes.error ?? budgetRes.error ?? null;
      setState({
        key: queryKey,
        data: error
          ? null
          : {
              trend: trendRes.data ?? [],
              breakdown: breakdownRes.data ?? { byCategory: [], byTier: [] },
              budget: budgetRes.data ?? [],
            },
        error: error?.message ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const refetch = useCallback(() => setToken((n) => n + 1), []);

  // Keep the previous period's data visible while a new period loads (the charts
  // show their own skeletons off `loading`), rather than dropping to null and
  // flashing the full-screen spinner on every period switch. Matches the stale-
  // while-refetch behaviour of useMonthlySummary. `loading` stays true until the
  // response for the current query key lands.
  return {
    data: state?.data ?? null,
    loading: state?.key !== queryKey,
    error: state?.error ?? null,
    refetch,
  };
}
