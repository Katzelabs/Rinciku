import type { CategoryTier } from '@/features/categories/hooks/use-categories';
import type { EssentialWithCategory } from '../api';

export type Baseline = {
  total_idr: number;
  by_tier: Record<CategoryTier, number>;
};

export function computeBaseline(
  essentials: EssentialWithCategory[],
  fxRate: number
): Baseline {
  const baseline: Baseline = {
    total_idr: 0,
    by_tier: { fixed: 0, needs: 0, wants: 0 },
  };
  for (const row of essentials) {
    if (!row.is_active) continue;
    const amount = Number(row.estimated_amount);
    if (Number.isNaN(amount)) continue;
    const idrAmount = row.currency === 'USD' ? amount * fxRate : amount;
    baseline.total_idr += idrAmount;
    const tier = row.category?.tier as CategoryTier | undefined;
    if (tier && tier in baseline.by_tier) {
      baseline.by_tier[tier] += idrAmount;
    }
  }
  baseline.total_idr = Math.round(baseline.total_idr * 100) / 100;
  (Object.keys(baseline.by_tier) as CategoryTier[]).forEach((tier) => {
    baseline.by_tier[tier] = Math.round(baseline.by_tier[tier] * 100) / 100;
  });
  return baseline;
}
