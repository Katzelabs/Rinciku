import { useEffect, useState } from 'react';
import type { Tables } from '@/lib/database.types';
import { listCategories } from '../api';

type Category = Tables<'categories'>;

export type CategoryTier = 'fixed' | 'needs' | 'wants';

export type GroupedCategories = Record<CategoryTier, Category[]>;

export type UseCategoriesResult = {
  data: Category[] | undefined;
  isLoading: boolean;
  error: string | null;
};

export function useCategories(): UseCategoriesResult {
  const [data, setData] = useState<Category[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listCategories()
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

export function groupByTier(categories: Category[]): GroupedCategories {
  const grouped: GroupedCategories = { fixed: [], needs: [], wants: [] };
  for (const category of categories) {
    const tier = category.tier as CategoryTier;
    if (tier in grouped) {
      grouped[tier].push(category);
    }
  }
  return grouped;
}
