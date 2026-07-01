import type { Tables } from '@rinciku/db';
import type { CurrencyCode } from '@rinciku/core';

export type BudgetRow = Tables<'budgets'>;
export type TierBudgetRow = Tables<'tier_budgets'>;

// Targets are written in the user's base currency in effect at write time,
// mirroring expenses/essentials. Aggregations convert back at read time.
export type UpsertBudgetInput = {
  user_id: string;
  category_id: string;
  period_year: number;
  period_month: number;
  amount: number;
  currency: CurrencyCode;
};

export type UpsertTierBudgetInput = {
  user_id: string;
  tier_id: string;
  period_year: number;
  period_month: number;
  amount: number;
  currency: CurrencyCode;
};

// jsonb maps keyed by id::text → spend in base currency.
export type BudgetActuals = {
  by_category: Record<string, number>;
  by_tier: Record<string, number>;
};
