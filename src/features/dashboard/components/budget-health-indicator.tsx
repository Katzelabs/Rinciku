import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCycleLengthDays } from '@/lib/cycle';
import { formatCurrency } from '@/lib/format';
import type { MonthlySummary } from '../api';
import { computeHealth, type HealthStatus } from '../lib/health';

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
  | 'remaining'
  | 'days_left'
  | 'baseline_uncovered'
  | 'spent_total'
  | 'cycle'
  | 'base_currency'
>;

type Props = {
  summary: SummaryForHealth;
  className?: string;
};

export function BudgetHealthIndicator({ summary, className }: Props) {
  const totalDays = getCycleLengthDays(summary.cycle);
  const daysElapsed = Math.max(0, totalDays - summary.days_left);
  const status = computeHealth({
    remaining: summary.remaining,
    days_left: summary.days_left,
    baseline_uncovered: summary.baseline_uncovered,
    spent: summary.spent_total,
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
  const base = summary.base_currency;
  const remaining = formatCurrency(Math.max(0, summary.remaining), base);
  const uncovered = formatCurrency(summary.baseline_uncovered, base);

  if (status === 'over') {
    if (summary.remaining < 0) {
      return `You're ${formatCurrency(Math.abs(summary.remaining), base)} past this cycle's income.`;
    }
    return `Remaining ${remaining} won't cover your ${uncovered} of unpaid essentials.`;
  }
  if (status === 'watch') {
    const burn = daysElapsed > 0 ? summary.spent_total / daysElapsed : 0;
    const projected = formatCurrency(burn * summary.days_left, base);
    return `At your current pace you'd spend about ${projected} more — more than the ${remaining} left.`;
  }
  return `${remaining} left with ${summary.days_left} day${summary.days_left === 1 ? '' : 's'} to go. Keep it up.`;
}
