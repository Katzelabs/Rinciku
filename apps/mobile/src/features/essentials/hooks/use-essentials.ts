import { useEffect, useMemo, useState } from 'react';
import { ensureRates, type CurrencyCode } from '@rinciku/core';
import { computeBaseline, type Baseline } from '@rinciku/domain/essentials';
import type { Tables } from '@rinciku/db';

import { listEssentials } from '@/features/essentials/api';
import { listTiers } from '@/features/categories/api';
import type { EssentialWithCategory } from '@/features/essentials/types';

type Tier = Tables<'tiers'>;

const EMPTY_ESSENTIALS: EssentialWithCategory[] = [];

type FetchState = {
  key: number;
  essentials: EssentialWithCategory[];
  tiers: Tier[];
  error: string | null;
};

// Loads essentials + tiers with the cancellable-effect + refetch-token pattern
// (same as CategoriesManager) and derives the FX-converted monthly baseline.
// `ensureRates()` runs first so `computeBaseline` (sync, reads the module rate
// map) has live rates — falling back to the frozen stub offline.
export function useEssentials(base: CurrencyCode) {
  const [token, setToken] = useState(0);
  const [state, setState] = useState<FetchState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await ensureRates();
      const [ess, tiers] = await Promise.all([listEssentials(), listTiers()]);
      if (cancelled) return;
      setState({
        key: token,
        essentials: ess.data ?? [],
        tiers: tiers.data ?? [],
        error: ess.error?.message ?? tiers.error?.message ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loading = state?.key !== token;
  const essentials = state?.essentials ?? EMPTY_ESSENTIALS;
  const baseline: Baseline = useMemo(
    () => computeBaseline(essentials, base),
    [essentials, base]
  );

  return {
    essentials,
    tiers: state?.tiers ?? [],
    baseline,
    loading,
    error: state?.error ?? null,
    refetch: () => setToken((n) => n + 1),
  };
}
