import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency, getCycleLengthDays } from '@rinciku/core';

import { Fonts, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui';
import type { MonthlySummary } from '@/features/dashboard/types';
import { useTheme } from '@/hooks/use-theme';

// Income / spent / net / avg-per-day cards for the current cycle. Mirrors the
// web dashboard's top summary row.
export function SummaryCards({ summary }: { summary: MonthlySummary }) {
  const { t } = useTranslation('dashboard');
  const c = useTheme();
  const base = summary.base_currency;

  const totalDays = getCycleLengthDays(summary.cycle);
  const daysElapsed = Math.max(1, totalDays - summary.days_left);
  const avgPerDay = summary.spent_total / daysElapsed;
  const netNegative = summary.remaining < 0;

  return (
    <View style={styles.grid}>
      <StatCard
        label={t('summary.income')}
        value={formatCurrency(summary.income_received, base)}
      />
      <StatCard
        label={t('summary.spent')}
        value={formatCurrency(summary.spent_total, base)}
      />
      <StatCard
        label={t('summary.net')}
        value={formatCurrency(summary.remaining, base)}
        valueColor={netNegative ? c.destructive : undefined}
      />
      <StatCard
        label={t('summary.avgPerDay')}
        value={formatCurrency(avgPerDay, base)}
        hint={t('summary.over', { count: daysElapsed })}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  hint,
  valueColor,
}: {
  label: string;
  value: string;
  hint?: string;
  valueColor?: string;
}) {
  const c = useTheme();
  return (
    <Card padding={Spacing.three} style={styles.card}>
      <Text style={[styles.label, { color: c.mutedForeground }]}>{label}</Text>
      <Text
        style={[styles.value, { color: valueColor ?? c.foreground }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {hint ? (
        <Text style={[styles.hint, { color: c.mutedForeground }]}>{hint}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    gap: Spacing.one,
  },
  label: { fontFamily: Fonts.medium, fontSize: 13 },
  value: { fontFamily: Fonts.bold, fontSize: 18 },
  hint: { fontFamily: Fonts.regular, fontSize: 12 },
});
