import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency, getCycleLengthDays } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
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
      <Card
        label={t('summary.income')}
        value={formatCurrency(summary.income_received, base)}
      />
      <Card
        label={t('summary.spent')}
        value={formatCurrency(summary.spent_total, base)}
      />
      <Card
        label={t('summary.net')}
        value={formatCurrency(summary.remaining, base)}
        valueColor={netNegative ? c.destructive : undefined}
      />
      <Card
        label={t('summary.avgPerDay')}
        value={formatCurrency(avgPerDay, base)}
        hint={t('summary.over', { count: daysElapsed })}
      />
    </View>
  );
}

function Card({
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
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  label: { fontFamily: Fonts.medium, fontSize: 13 },
  value: { fontFamily: Fonts.bold, fontSize: 18 },
  hint: { fontFamily: Fonts.regular, fontSize: 12 },
});
