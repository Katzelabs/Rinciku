import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getBudgetsView, type BudgetsView } from '@rinciku/domain/budgets';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { supabase } from '@/lib/supabase';

export type UseBudgetsResult = {
  data: BudgetsView | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

// The orchestration (profile → cycle → targets + actuals → per-tier view) lives
// in @rinciku/domain/budgets so web and mobile share one copy. This hook only
// wires it to React state + the mobile Supabase client.
export function useBudgets(): UseBudgetsResult {
  const { profile } = useAuth();
  const { t } = useTranslation('budgets');
  const [data, setData] = useState<BudgetsView | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(0);

  const refetch = useCallback(() => setToken((n) => n + 1), []);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    getBudgetsView(supabase, profile)
      .then(({ data, error }) => {
        if (cancelled) return;
        setData(data ?? undefined);
        setError(error);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('page.loadError'));
        setData(undefined);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, token, t]);

  return { data, isLoading, error, refetch };
}
