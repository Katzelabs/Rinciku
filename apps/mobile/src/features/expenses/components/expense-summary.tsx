import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Four stat cards: total spent, transaction count, average per transaction, and
// average per day over the selected range. Mirrors the web ExpenseSummary.
export function ExpenseSummary({
  total,
  count,
  base,
  days,
}: {
  total: number;
  count: number;
  base: CurrencyCode;
  days: number;
}) {
  const { t } = useTranslation('expenses');
  const avgPerTransaction = count > 0 ? total / count : 0;
  const avgPerDay = days > 0 ? total / days : 0;

  return (
    <View style={styles.grid}>
      <Stat label={t('summary.totalSpent')} value={formatCurrency(total, base)} />
      <Stat label={t('summary.transactions')} value={String(count)} />
      <Stat
        label={t('summary.avgPerTransaction')}
        value={formatCurrency(avgPerTransaction, base)}
      />
      <Stat
        label={t('summary.avgPerDay')}
        value={formatCurrency(avgPerDay, base)}
        hint={t('summary.overDays', { count: days })}
      />
    </View>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const c = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.label, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[styles.value, { color: c.foreground }]} numberOfLines={1}>
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
