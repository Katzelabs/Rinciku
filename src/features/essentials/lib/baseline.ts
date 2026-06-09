import { convertToBase, type CurrencyCode } from '@/lib/fx';
import type { CategoryTier } from '@/features/categories/hooks/use-categories';
import type { EssentialWithCategory } from '../api';

export type Baseline = {
  total_base: number;
  by_tier: Record<CategoryTier, number>;
};

export function computeBaseline(
  essentials: EssentialWithCategory[],
  base: CurrencyCode
): Baseline {
  const baseline: Baseline = {
    total_base: 0,
    by_tier: { fixed: 0, needs: 0, wants: 0 },
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
    const tier = row.category?.tier as CategoryTier | undefined;
    if (tier && tier in baseline.by_tier) {
      baseline.by_tier[tier] += amount_base;
    }
  }
  baseline.total_base = Math.round(baseline.total_base * 100) / 100;
  (Object.keys(baseline.by_tier) as CategoryTier[]).forEach((tier) => {
    baseline.by_tier[tier] = Math.round(baseline.by_tier[tier] * 100) / 100;
  });
  return baseline;
}
