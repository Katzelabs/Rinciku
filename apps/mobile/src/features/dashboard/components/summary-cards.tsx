import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { AppText, Card, Divider } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Period-scoped totals for the dashboard, driven by the range analytics trend
// (so they react to the header period picker). Stacked as label-left / amount-
// right rows rather than three columns: long IDR amounts (Rp8.096.000) would
// collide side-by-side on a narrow phone. The screen's one hero is the safe-to-
// spend BudgetHero above; here Spent is ink, income uses the `positive` money
// token, and net turns red when spending outpaces income.
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

  return (
    <Card style={styles.card}>
      <Row label={t('summary.spent')} value={formatCurrency(spent, base)} />
      <Divider />
      <Row
        label={t('summary.income')}
        value={formatCurrency(income, base)}
        valueColor={c.positive}
      />
      <Divider />
      <Row
        label={t('summary.net')}
        value={formatCurrency(net, base)}
        valueColor={net < 0 ? c.destructive : c.positive}
      />
      <AppText variant='caption' color='mutedForeground' style={styles.footnote}>
        {t('summary.over', { count: days })}
      </AppText>
    </Card>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <AppText variant='label' color='mutedForeground'>
        {label}
      </AppText>
      <AppText
        variant='amount'
        numberOfLines={1}
        style={[styles.value, valueColor ? { color: valueColor } : undefined]}
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  value: { flexShrink: 1, textAlign: 'right' },
  footnote: { marginTop: Spacing.half },
});
