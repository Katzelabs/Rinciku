import { useCallback, useEffect, useState } from 'react';
import type { Tables } from '@rinciku/db';

import { listIncomeCategories } from '@/features/incomes/api';

export type IncomeSource = Tables<'income_categories'>;

type State = {
  key: number;
  sources: IncomeSource[];
  error: string | null;
};

// Loads the user's active income sources (flat taxonomy, seeded at signup).
// Shared by the source picker and the sources manager; `refetch` re-runs after
// an add/edit/delete.
export function useIncomeSources() {
  const [token, setToken] = useState(0);
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let cancelled = false;
    listIncomeCategories().then((res) => {
      if (cancelled) return;
      setState({
        key: token,
        sources: res.data ?? [],
        error: res.error?.message ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const refetch = useCallback(() => setToken((n) => n + 1), []);

  return {
    sources: state?.sources ?? [],
    loading: state?.key !== token,
    error: state?.error ?? null,
    refetch,
  };
}
