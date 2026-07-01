import { useCallback, useEffect, useState } from 'react';
import {
  convertToBase,
  ensureRates,
  getCurrentCycle,
  type CurrencyCode,
} from '@rinciku/core';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { listIncomes, sumIncomes } from '@/features/incomes/api';
import type { IncomeWithRelations } from '@/features/incomes/types';

export type IncomeFilters = {
  from: Date;
  to: Date;
  sourceIds: string[];
};

// A generous single page — mobile shows the current cycle, which comfortably
// fits one request. (No pager UI; the web table owns pagination.)
const PAGE_SIZE = 200;

const EMPTY_ROWS: IncomeWithRelations[] = [];

type FetchState = {
  key: string;
  incomes: IncomeWithRelations[];
  count: number;
  total: number;
  error: string | null;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Loads incomes + a filtered total for the current cycle. Mirrors useExpenses:
// filters (date range, sources, search) live here; `search` is debounced so
// typing doesn't refetch on every keystroke. Loading is derived from a query key
// so it stays true across filter-triggered refetches.
export function useIncomes() {
  const { profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const [filters, setFilters] = useState<IncomeFilters>(() => {
    const cycle = getCurrentCycle({
      month_start_day: profile?.month_start_day ?? 1,
    });
    return { from: cycle.start, to: cycle.end, sourceIds: [] };
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [token, setToken] = useState(0);
  const [state, setState] = useState<FetchState | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const queryKey = JSON.stringify({
    from: filters.from.toISOString(),
    to: filters.to.toISOString(),
    sourceIds: filters.sourceIds,
    search: debouncedSearch.trim(),
    token,
    base,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await ensureRates();
      const params = {
        from: filters.from.toISOString(),
        to: filters.to.toISOString(),
        categoryIds:
          filters.sourceIds.length > 0 ? filters.sourceIds : undefined,
        search: debouncedSearch.trim() || undefined,
      };
      const [listRes, sumRes] = await Promise.all([
        listIncomes({ ...params, limit: PAGE_SIZE, offset: 0 }),
        sumIncomes(params),
      ]);
      if (cancelled) return;
      const totalBase = (sumRes.data ?? []).reduce(
        (acc, row) =>
          acc +
          convertToBase(Number(row.amount), row.currency as CurrencyCode, base)
            .amount_base,
        0
      );
      setState({
        key: queryKey,
        incomes: listRes.data ?? [],
        count: listRes.count ?? 0,
        total: round2(totalBase),
        error: listRes.error?.message ?? sumRes.error?.message ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const setDateRange = useCallback((from: Date, to: Date) => {
    setFilters((f) => ({ ...f, from, to }));
  }, []);
  const setSourceIds = useCallback((sourceIds: string[]) => {
    setFilters((f) => ({ ...f, sourceIds }));
  }, []);
  const refetch = useCallback(() => setToken((n) => n + 1), []);

  return {
    incomes: state?.incomes ?? EMPTY_ROWS,
    count: state?.count ?? 0,
    total: state?.total ?? 0,
    base,
    loading: state?.key !== queryKey,
    error: state?.error ?? null,
    filters,
    search,
    setSearch,
    setDateRange,
    setSourceIds,
    refetch,
  };
}
