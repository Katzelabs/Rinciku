import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';
import type { CategoryTier } from '@/features/categories/hooks/use-categories';
import type { TierTotals } from '../api';

const TIERS = ['fixed', 'needs', 'wants'] as const satisfies readonly CategoryTier[];

const TIER_LABELS: Record<CategoryTier, string> = {
  fixed: 'Fixed',
  needs: 'Needs',
  wants: 'Wants',
};

const TIER_COLORS: Record<CategoryTier, string> = {
  fixed: '#7a8d6a',
  needs: '#a3a86b',
  wants: '#c4a86b',
};

type Props = {
  by_tier: TierTotals;
  base: CurrencyCode;
  className?: string;
};

export function NeedsVsWantsBreakdown({ by_tier, base, className }: Props) {
  const total = by_tier.fixed + by_tier.needs + by_tier.wants;

  if (total <= 0) {
    return (
      <div
        className={cn(
          'rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground',
          className
        )}
      >
        No spending yet this cycle.
      </div>
    );
  }

  const segments = TIERS.map((tier) => ({
    tier,
    amount: by_tier[tier],
    percent: (by_tier[tier] / total) * 100,
  }));

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className='flex h-3 w-full overflow-hidden rounded-full bg-muted'
        role='img'
        aria-label='Spending by tier'
      >
        {segments.map(({ tier, percent }) =>
          percent > 0 ? (
            <div
              key={tier}
              style={{ width: `${percent}%`, backgroundColor: TIER_COLORS[tier] }}
              title={`${TIER_LABELS[tier]} ${percent.toFixed(0)}%`}
            />
          ) : null
        )}
      </div>
      <ul className='space-y-2 text-sm'>
        {segments.map(({ tier, amount, percent }) => (
          <li key={tier} className='flex items-center justify-between gap-3'>
            <span className='flex items-center gap-2'>
              <span
                className='size-2.5 rounded-full'
                style={{ backgroundColor: TIER_COLORS[tier] }}
              />
              <span className='font-medium'>{TIER_LABELS[tier]}</span>
              <span className='text-muted-foreground'>· {percent.toFixed(0)}%</span>
            </span>
            <span className='font-medium tabular-nums'>
              {formatCurrency(amount, base)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
