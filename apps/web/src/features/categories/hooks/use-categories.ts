import { useEffect, useState } from 'react';
import type { Tables } from '@rinciku/db';
import { listCategories, listTiers } from '../api';

type Category = Tables<'categories'>;
export type Tier = Tables<'tiers'>;

export type TierGroup = { tier: Tier | null; categories: Category[] };

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

// Group categories under their tier, ordered by the tiers list. Categories with
// no tier (or whose tier was deleted) collect into a trailing "Untiered" group
// (tier === null).
export function groupByTier(
  categories: Category[],
  tiers: Tier[]
): TierGroup[] {
  const tierIds = new Set(tiers.map((t) => t.id));
  const byTier = new Map<string, Category[]>();
  const untiered: Category[] = [];

  for (const category of categories) {
    if (category.tier_id && tierIds.has(category.tier_id)) {
      const bucket = byTier.get(category.tier_id) ?? [];
      bucket.push(category);
      byTier.set(category.tier_id, bucket);
    } else {
      untiered.push(category);
    }
  }

  const groups: TierGroup[] = tiers.map((tier) => ({
    tier,
    categories: byTier.get(tier.id) ?? [],
  }));
  if (untiered.length > 0) {
    groups.push({ tier: null, categories: untiered });
  }
  return groups;
}
