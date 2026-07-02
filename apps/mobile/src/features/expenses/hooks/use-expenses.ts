import { useCallback, useEffect, useState } from 'react';
import {
  convertToBase,
  ensureRates,
  getCurrentCycle,
  type CurrencyCode,
} from '@rinciku/core';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { listExpenses, sumExpenses } from '@/features/expenses/api';
import type { ExpenseWithRelations } from '@/features/expenses/types';

export type ExpenseFilters = {
  from: Date;
  to: Date;
  categoryIds: string[];
};

export type UseExpensesOptions = {
  /**
   * Rows fetched (and shown) per request. The overview passes a small preview
   * count; the transactions list passes its page size and drives the pager.
   */
  pageSize?: number;
};

// Fallback when a caller doesn't specify a page size — generous enough to hold a
// full cycle in one request for screens that don't paginate.
const DEFAULT_PAGE_SIZE = 200;

const EMPTY_ROWS: ExpenseWithRelations[] = [];

type FetchState = {
  key: string;
  expenses: ExpenseWithRelations[];
  count: number;
  total: number;
  error: string | null;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Loads expenses + a filtered total for the current cycle. Filters (date range,
// categories, search) live here; `search` is debounced so typing doesn't refetch
// on every keystroke. Loading is derived from a query key (not a
// setState-in-effect) so it stays true across filter-triggered refetches.
export function useExpenses(options: UseExpensesOptions = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const { profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const [filters, setFilters] = useState<ExpenseFilters>(() => {
    const cycle = getCurrentCycle({
      month_start_day: profile?.month_start_day ?? 1,
    });
    return { from: cycle.start, to: cycle.end, categoryIds: [] };
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [token, setToken] = useState(0);
  const [state, setState] = useState<FetchState | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const queryKey = JSON.stringify({
    from: filters.from.toISOString(),
    to: filters.to.toISOString(),
    categoryIds: filters.categoryIds,
    search: debouncedSearch.trim(),
    page,
    pageSize,
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
          filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
        search: debouncedSearch.trim() || undefined,
      };
      const [listRes, sumRes] = await Promise.all([
        listExpenses({ ...params, limit: pageSize, offset: page * pageSize }),
        sumExpenses(params),
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
        expenses: listRes.data ?? [],
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

  // Any filter change resets to the first page — the current page number is
  // meaningless against a different result set.
  const onSearchChange = useCallback((next: string) => {
    setSearch(next);
    setPage(0);
  }, []);
  const setDateRange = useCallback((from: Date, to: Date) => {
    setFilters((f) => ({ ...f, from, to }));
    setPage(0);
  }, []);
  const setCategoryIds = useCallback((categoryIds: string[]) => {
    setFilters((f) => ({ ...f, categoryIds }));
    setPage(0);
  }, []);
  const refetch = useCallback(() => setToken((n) => n + 1), []);

  const count = state?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  // Clamp the page if the result set shrank beneath it (e.g. deleting the last
  // row on the last page). Guarded to the resolved query so a stale count from
  // an in-flight fetch can't bounce the user to page 1.
  useEffect(() => {
    if (state?.key !== queryKey) return;
    if (page > pageCount - 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(pageCount - 1);
    }
  }, [state?.key, queryKey, page, pageCount]);

  return {
    expenses: state?.expenses ?? EMPTY_ROWS,
    count,
    total: state?.total ?? 0,
    base,
    loading: state?.key !== queryKey,
    error: state?.error ?? null,
    filters,
    search,
    setSearch: onSearchChange,
    setDateRange,
    setCategoryIds,
    page,
    pageCount,
    setPage,
    refetch,
  };
}
