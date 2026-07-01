import type { CurrencyCode, Cycle } from '@rinciku/core';
import type { Tier } from '../categories';

// Spend per tier, keyed by tier id (matches the SQL `by_tier` jsonb map).
export type TierTotals = Record<string, number>;

// Current-cycle snapshot for the dashboard summary. The filterable analytics
// (charts) types stay web-local since mobile defers charts.
export type MonthlySummary = {
  cycle: Cycle;
  base_currency: CurrencyCode;
  expected_monthly_income: number;
  income_received: number;
  spent_total: number;
  remaining: number;
  days_left: number;
  baseline_total: number;
  baseline_uncovered: number;
  by_tier: TierTotals;
  uncategorized_spent: number;
  tiers: Tier[];
};
