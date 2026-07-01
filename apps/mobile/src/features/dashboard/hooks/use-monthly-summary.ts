import { useCallback, useEffect, useState } from 'react';
import { ensureRates } from '@rinciku/core';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { getMonthlySummary } from '@/features/dashboard/api';
import type { MonthlySummary } from '@/features/dashboard/types';

type FetchState = {
  key: string;
  summary: MonthlySummary | null;
  error: string | null;
};

// Loads the current-cycle summary. `ensureRates()` runs first so the RPC's
// `p_rates` argument and the base-currency conversions reflect live rates
// (falling back to the frozen stub offline). Loading is derived from a query key
// (not a setState-in-effect) so it stays true across refetches.
export function useMonthlySummary() {
  const { profile } = useAuth();
  const [token, setToken] = useState(0);
  const [state, setState] = useState<FetchState | null>(null);

  const queryKey = profile ? `${profile.id}:${token}` : '';

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    void (async () => {
      await ensureRates();
      const { data, error } = await getMonthlySummary(profile);
      if (cancelled) return;
      setState({ key: queryKey, summary: data, error: error?.message ?? null });
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, queryKey]);

  const refetch = useCallback(() => setToken((n) => n + 1), []);

  return {
    summary: state?.summary ?? null,
    loading: state?.key !== queryKey,
    error: state?.error ?? null,
    refetch,
  };
}
