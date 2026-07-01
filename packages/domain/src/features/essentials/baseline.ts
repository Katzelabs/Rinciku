import { convertToBase, type CurrencyCode } from '@rinciku/core';

import type { EssentialWithCategory } from './types';

export type Baseline = {
  total_base: number;
  // Spend per tier, keyed by tier id. Essentials with no tier are not bucketed
  // here but still count toward total_base.
  by_tier: Record<string, number>;
};

export function computeBaseline(
  essentials: EssentialWithCategory[],
  base: CurrencyCode
): Baseline {
  const baseline: Baseline = {
    total_base: 0,
    by_tier: {},
  };
  for (const row of essentials) {
    if (!row.is_active) continue;
    const amount = Number(row.estimated_amount);
    if (Number.isNaN(amount)) continue;
    const { amount_base } = convertToBase(
      amount,
      row.currency as CurrencyCode,
      base
    );
    baseline.total_base += amount_base;
    const tierId = row.category?.tier_id;
    if (tierId) {
      baseline.by_tier[tierId] = (baseline.by_tier[tierId] ?? 0) + amount_base;
    }
  }
  baseline.total_base = Math.round(baseline.total_base * 100) / 100;
  for (const tierId of Object.keys(baseline.by_tier)) {
    baseline.by_tier[tierId] = Math.round(baseline.by_tier[tierId] * 100) / 100;
  }
  return baseline;
}
