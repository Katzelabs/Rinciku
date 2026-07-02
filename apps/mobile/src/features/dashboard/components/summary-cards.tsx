import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { AppText, Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Period summary for the dashboard, styled like the expenses / incomes
// TransactionSummaryHeader: one hero total (Spent) over a compact row of two
// secondary stats (Income · Net). Totals come from the range-scoped analytics
// trend (see useAnalytics), so the whole card reacts to the header period
// picker. Net turns red when spending outpaces income.
export function SummaryCards({
  income,
  spent,
  days,
  base,
}: {
  income: number;
  spent: number;
  days: number;
  base: CurrencyCode;
}) {
  const { t } = useTranslation('dashboard');
  const c = useTheme();

  const net = income - spent;
  const netNegative = net < 0;

  return (
    <Card style={styles.card}>
      <AppText variant='amountSmall' color='mutedForeground'>
        {t('summary.spent')}
      </AppText>
      <AppText
        variant='hero'
        style={styles.hero}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {formatCurrency(spent, base)}
      </AppText>
      <AppText variant='caption' color='mutedForeground'>
        {t('summary.over', { count: days })}
      </AppText>

      <View style={[styles.divider, { backgroundColor: c.border }]} />

      <View style={styles.statsRow}>
        <Stat label={t('summary.income')} value={formatCurrency(income, base)} />
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        <Stat
          label={t('summary.net')}
          value={formatCurrency(net, base)}
          valueColor={netNegative ? c.destructive : undefined}
        />
      </View>
    </Card>
  );
}

function Stat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.stat}>
      <AppText
        variant='amount'
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </AppText>
      <AppText variant='caption' color='mutedForeground' numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.half },
  hero: { marginTop: Spacing.one },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.three,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, gap: Spacing.half, alignItems: 'flex-start' },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
});
