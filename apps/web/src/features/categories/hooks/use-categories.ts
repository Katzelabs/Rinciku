import { useEffect, useState } from 'react';
import type { Tables } from '@rinciku/db';
// groupByTier + Tier/TierGroup types are shared with mobile in @rinciku/domain;
// imported for local use and re-exported so existing web imports keep working.
import {
  groupByTier,
  type Tier,
  type TierGroup,
} from '@rinciku/domain/categories';
import { listCategories, listTiers } from '../api';

export { groupByTier, type Tier, type TierGroup };

type Category = Tables<'categories'>;

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

export type UseTiersResult = {
  data: Tier[] | undefined;
  isLoading: boolean;
  error: string | null;
};

export function useTiers(): UseTiersResult {
  const [data, setData] = useState<Tier[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTiers()
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
