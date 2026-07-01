import { useCallback, useEffect, useState } from 'react';
import { ensureRates } from '@rinciku/core';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { getPeriodSpend } from '@/features/dashboard/api';
import type { PeriodSpend } from '@/features/dashboard/types';

type FetchState = {
  key: string;
  spend: PeriodSpend | null;
  error: string | null;
};

// Loads the spend total + by-tier breakdown for an arbitrary [from, to] window
// (the dashboard's period picker). Kept separate from the monthly summary so the
// budget cards stay on the current cycle. `ensureRates()` runs first so the RPC's
// base-currency conversion uses live rates. Loading is derived from a query key
// so it stays true across refetches.
export function usePeriodSpend(from: Date, to: Date) {
  const { profile } = useAuth();
  const [token, setToken] = useState(0);
  const [state, setState] = useState<FetchState | null>(null);

  const queryKey = profile
    ? `${profile.id}:${from.toISOString()}:${to.toISOString()}:${token}`
    : '';

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    void (async () => {
      await ensureRates();
      const { data, error } = await getPeriodSpend(profile, from, to);
      if (cancelled) return;
      setState({ key: queryKey, spend: data, error: error?.message ?? null });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const refetch = useCallback(() => setToken((n) => n + 1), []);

  return {
    spend: state?.spend ?? null,
    loading: state?.key !== queryKey,
    error: state?.error ?? null,
    refetch,
  };
}
