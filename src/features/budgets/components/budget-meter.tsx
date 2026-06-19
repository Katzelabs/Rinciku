import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { CurrencyCode } from '@/lib/fx';

import type { BudgetStatus } from '../lib/period';

// Literal class strings (Tailwind needs them whole, not concatenated) that
// recolor the Progress indicator per status via its data-slot child selector.
const INDICATOR_CLASS: Record<BudgetStatus, string> = {
  ok: '[&_[data-slot=progress-indicator]]:bg-primary',
  approaching: '[&_[data-slot=progress-indicator]]:bg-amber-500',
  over: '[&_[data-slot=progress-indicator]]:bg-destructive',
  none: '[&_[data-slot=progress-indicator]]:bg-muted-foreground/30',
};

const BADGE_CLASS: Record<BudgetStatus, string> = {
  ok: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  approaching:
    'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-500',
  over: 'border-transparent bg-destructive/15 text-destructive',
  none: '',
};

const BADGE_LABEL: Record<BudgetStatus, string> = {
  ok: 'On track',
  approaching: 'Near limit',
  over: 'Over',
  none: 'No target',
};

export function StatusBadge({ status }: { status: BudgetStatus }) {
  return (
    <Badge variant='outline' className={cn('text-xs', BADGE_CLASS[status])}>
      {BADGE_LABEL[status]}
    </Badge>
  );
}

type BudgetMeterProps = {
  spent: number;
  target: number | null;
  pct: number | null;
  status: BudgetStatus;
  base: CurrencyCode;
};

// Spent-vs-target line: amounts + a color-coded progress bar capped at 100%
// (the "over" color signals overflow rather than overshooting the bar).
export function BudgetMeter({
  spent,
  target,
  pct,
  status,
  base,
}: BudgetMeterProps) {
  const value = pct == null ? 0 : Math.min(100, Math.round(pct * 100));
  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-baseline justify-between text-sm'>
        <span className='font-medium'>{formatCurrency(spent, base)}</span>
        <span className='text-muted-foreground'>
          {target == null ? 'no target' : `of ${formatCurrency(target, base)}`}
          {pct != null && (
            <span className='ml-1 tabular-nums'>
              ({Math.round(pct * 100)}%)
            </span>
          )}
        </span>
      </div>
      <Progress value={value} className={INDICATOR_CLASS[status]} />
    </div>
  );
}
