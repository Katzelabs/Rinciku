import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCycleLengthDays } from '@/lib/cycle';
import type { MonthlySummary } from '../api';
import { computeHealth, type HealthStatus } from '../lib/health';

const IDR_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const STATUS_STYLES: Record<HealthStatus, { label: string; badge: string }> = {
  'on-track': {
    label: 'On track',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  watch: {
    label: 'Watch',
    badge: 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
  },
  over: {
    label: 'Over',
    badge: 'bg-destructive/15 text-destructive',
  },
};

export type SummaryForHealth = Pick<
  MonthlySummary,
  | 'remaining_idr'
  | 'days_left'
  | 'baseline_uncovered_idr'
  | 'spent_idr_total'
  | 'cycle'
>;

type Props = {
  summary: SummaryForHealth;
  className?: string;
};

export function BudgetHealthIndicator({ summary, className }: Props) {
  const totalDays = getCycleLengthDays(summary.cycle);
  const daysElapsed = Math.max(0, totalDays - summary.days_left);
  const status = computeHealth({
    remaining: summary.remaining_idr,
    days_left: summary.days_left,
    baseline_uncovered: summary.baseline_uncovered_idr,
    spent: summary.spent_idr_total,
    days_elapsed: daysElapsed,
  });
  const { label, badge } = STATUS_STYLES[status];
  const message = explain(status, summary, daysElapsed);

  return (
    <div className={cn('space-y-2', className)}>
      <Badge variant='outline' className={cn('border-transparent', badge)}>
        {label}
      </Badge>
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  );
}

function explain(
  status: HealthStatus,
  summary: SummaryForHealth,
  daysElapsed: number
): string {
  const remaining = IDR_FORMATTER.format(Math.max(0, summary.remaining_idr));
  const uncovered = IDR_FORMATTER.format(summary.baseline_uncovered_idr);

  if (status === 'over') {
    if (summary.remaining_idr < 0) {
      return `You're ${IDR_FORMATTER.format(Math.abs(summary.remaining_idr))} past this cycle's income.`;
    }
    return `Remaining ${remaining} won't cover your ${uncovered} of unpaid essentials.`;
  }
  if (status === 'watch') {
    const burn = daysElapsed > 0 ? summary.spent_idr_total / daysElapsed : 0;
    const projected = IDR_FORMATTER.format(burn * summary.days_left);
    return `At your current pace you'd spend about ${projected} more — more than the ${remaining} left.`;
  }
  return `${remaining} left with ${summary.days_left} day${summary.days_left === 1 ? '' : 's'} to go. Keep it up.`;
}
