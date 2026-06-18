import { useEffect, useState } from 'react';
import type { Tables } from '@/lib/database.types';
import { listIncomeCategories } from '../api';

export type IncomeCategory = Tables<'income_categories'>;

export type UseIncomeCategoriesResult = {
  data: IncomeCategory[] | undefined;
  isLoading: boolean;
  error: string | null;
};

export function useIncomeCategories(): UseIncomeCategoriesResult {
  const [data, setData] = useState<IncomeCategory[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listIncomeCategories()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setData(undefined);
        } else {
          setError(null);
          setData(data ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
