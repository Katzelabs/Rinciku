import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { StyleSheet, View } from 'react-native';

import { formatCurrency, getCycleLengthDays } from '@rinciku/core';
import { computeHealth, type HealthStatus } from '@rinciku/domain/dashboard';

import { Radius, Spacing } from '@/constants/theme';
import { AppText, Card } from '@/components/ui';
import type { MonthlySummary } from '@/features/dashboard/types';
import { useTheme } from '@/hooks/use-theme';

// Budget-health badge + one-line explanation, ported from the web
// BudgetHealthIndicator. Colors follow the status; the message reuses the shared
// dashboard i18n keys.
export function HealthBadge({ summary }: { summary: MonthlySummary }) {
  const { t } = useTranslation('dashboard');
  const c = useTheme();

  const totalDays = getCycleLengthDays(summary.cycle);
  const daysElapsed = Math.max(0, totalDays - summary.days_left);
  const status = computeHealth({
    remaining: summary.remaining,
    days_left: summary.days_left,
    baseline_uncovered: summary.baseline_uncovered,
    spent: summary.spent_total,
    days_elapsed: daysElapsed,
  });

  const palette: Record<HealthStatus, { bg: string; fg: string; label: string }> =
    {
      'on-track': {
        bg: `${c.primary}22`,
        fg: c.foreground,
        label: t('health.status.onTrack'),
      },
      watch: {
        bg: `${c.warning}22`,
        fg: c.warningForeground,
        label: t('health.status.watch'),
      },
      over: {
        bg: `${c.destructive}22`,
        fg: c.destructive,
        label: t('health.status.over'),
      },
    };
  const { bg, fg, label } = palette[status];
  const message = explain(t, status, summary, daysElapsed);

  return (
    <Card style={styles.card}>
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <AppText variant='amountSmall' style={{ color: fg }}>
          {label}
        </AppText>
      </View>
      <AppText variant='caption' color='mutedForeground'>
        {message}
      </AppText>
    </Card>
  );
}

function explain(
  t: TFunction<'dashboard'>,
  status: HealthStatus,
  summary: MonthlySummary,
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
  return t('health.onTrackMessage', { remaining, count: summary.days_left });
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
});
