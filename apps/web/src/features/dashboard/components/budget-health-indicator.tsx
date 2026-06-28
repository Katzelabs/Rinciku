import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCycleLengthDays } from '@rinciku/core';
import { formatCurrency } from '@rinciku/core';
import type { MonthlySummary } from '../api';
import { computeHealth, type HealthStatus } from '../lib/health';

const STATUS_STYLES: Record<HealthStatus, { labelKey: string; badge: string }> =
  {
    'on-track': {
      labelKey: 'health.status.onTrack',
      badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    },
    watch: {
      labelKey: 'health.status.watch',
      badge: 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
    },
    over: {
      labelKey: 'health.status.over',
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
  const { t } = useTranslation('dashboard');
  const totalDays = getCycleLengthDays(summary.cycle);
  const daysElapsed = Math.max(0, totalDays - summary.days_left);
  const status = computeHealth({
    remaining: summary.remaining,
    days_left: summary.days_left,
    baseline_uncovered: summary.baseline_uncovered,
    spent: summary.spent_total,
    days_elapsed: daysElapsed,
  });
  const { labelKey, badge } = STATUS_STYLES[status];
  const message = explain(t, status, summary, daysElapsed);

  return (
    <div className={cn('space-y-2', className)}>
      <Badge variant='outline' className={cn('border-transparent', badge)}>
        {t(labelKey)}
      </Badge>
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  );
}

function explain(
  t: TFunction<'dashboard'>,
  status: HealthStatus,
  summary: SummaryForHealth,
  daysElapsed: number
): string {
  const base = summary.base_currency;
  const remaining = formatCurrency(Math.max(0, summary.remaining), base);
  const uncovered = formatCurrency(summary.baseline_uncovered, base);

  if (status === 'over') {
    if (summary.remaining < 0) {
      return t('health.pastIncome', {
        amount: formatCurrency(Math.abs(summary.remaining), base),
      });
    }
    return t('health.wontCover', { remaining, uncovered });
  }
  if (status === 'watch') {
    const burn = daysElapsed > 0 ? summary.spent_total / daysElapsed : 0;
    const projected = formatCurrency(burn * summary.days_left, base);
    return t('health.pace', { projected, remaining });
  }
  return t('health.onTrackMessage', {
    remaining,
    count: summary.days_left,
  });
}
