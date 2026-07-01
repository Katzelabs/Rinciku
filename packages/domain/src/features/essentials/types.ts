import type { Tables, TablesUpdate } from '@rinciku/db';
import type { CurrencyCode } from '@rinciku/core';

export type EssentialRow = Tables<'essentials'>;
export type EssentialUpdate = TablesUpdate<'essentials'>;

export type CategoryWithTier = Tables<'categories'> & {
  tier: Tables<'tiers'> | null;
};

export type EssentialWithCategory = EssentialRow & {
  category: CategoryWithTier | null;
};

export type CreateEssentialInput = {
  user_id: string;
  name: string;
  estimated_amount: number;
  currency: CurrencyCode;
  category_id: string | null;
  is_active?: boolean;
};
