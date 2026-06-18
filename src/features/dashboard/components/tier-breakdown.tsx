import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';
import type { Tier } from '@/features/categories/hooks/use-categories';
import type { TierTotals } from '../api';

const UNTIERED_COLOR = '#94a3b8';

type Segment = {
  key: string;
  label: string;
  color: string;
  amount: number;
};

type Props = {
  by_tier: TierTotals;
  tiers: Tier[];
  uncategorized?: number;
  base: CurrencyCode;
  className?: string;
};

export function TierBreakdown({
  by_tier,
  tiers,
  uncategorized = 0,
  base,
  className,
}: Props) {
  const segments: Segment[] = tiers
    .map((tier) => ({
      key: tier.id,
      label: tier.name,
      color: tier.color ?? UNTIERED_COLOR,
      amount: by_tier[tier.id] ?? 0,
    }))
    .filter((s) => s.amount > 0);

  if (uncategorized > 0) {
    segments.push({
      key: '__untiered__',
      label: 'Untiered',
      color: UNTIERED_COLOR,
      amount: uncategorized,
    });
  }

  const total = segments.reduce((sum, s) => sum + s.amount, 0);

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

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className='flex h-3 w-full overflow-hidden rounded-full bg-muted'
        role='img'
        aria-label='Spending by tier'
      >
        {segments.map((s) => {
          const percent = (s.amount / total) * 100;
          return percent > 0 ? (
            <div
              key={s.key}
              style={{ width: `${percent}%`, backgroundColor: s.color }}
              title={`${s.label} ${percent.toFixed(0)}%`}
            />
          ) : null;
        })}
      </div>
      <ul className='space-y-2 text-sm'>
        {segments.map((s) => {
          const percent = (s.amount / total) * 100;
          return (
            <li key={s.key} className='flex items-center justify-between gap-3'>
              <span className='flex items-center gap-2'>
                <span
                  className='size-2.5 rounded-full'
                  style={{ backgroundColor: s.color }}
                />
                <span className='font-medium'>{s.label}</span>
                <span className='text-muted-foreground'>
                  · {percent.toFixed(0)}%
                </span>
              </span>
              <span className='font-medium tabular-nums'>
                {formatCurrency(s.amount, base)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
