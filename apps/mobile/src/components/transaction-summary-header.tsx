import { StyleSheet, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { AppText, Card } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export type SummaryLabels = {
  /** Hero label, e.g. "Total spent" / "Total income". */
  total: string;
  transactions: string;
  avgPerTransaction: string;
  avgPerDay: string;
  /** Pluralized "over N days" hint shown under the hero. */
  overDays: string;
};

// Shared summary header for the expenses + incomes lists: one prominent hero
// total plus a compact row of secondary stats (count · avg/txn · avg/day).
// Income tints the hero with the primary (green); expenses stay neutral.
export function TransactionSummaryHeader({
  total,
  count,
  days,
  base,
  tone,
  labels,
}: {
  total: number;
  count: number;
  days: number;
  base: CurrencyCode;
  tone: 'expense' | 'income';
  labels: SummaryLabels;
}) {
  const c = useTheme();
  const avgPerTransaction = count > 0 ? total / count : 0;
  const avgPerDay = days > 0 ? total / days : 0;

  return (
    <Card style={styles.card}>
      <AppText variant='amountSmall' color='mutedForeground'>
        {labels.total}
      </AppText>
      <AppText
        variant='hero'
        color={tone === 'income' ? 'primary' : 'foreground'}
        style={styles.hero}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {tone === 'income' && total > 0 ? '+' : ''}
        {formatCurrency(total, base)}
      </AppText>
      <AppText variant='caption' color='mutedForeground'>
        {labels.overDays}
      </AppText>

      <View style={[styles.divider, { backgroundColor: c.border }]} />

      <View style={styles.statsRow}>
        <Stat label={labels.transactions} value={String(count)} />
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        <Stat
          label={labels.avgPerTransaction}
          value={formatCurrency(avgPerTransaction, base)}
        />
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        <Stat
          label={labels.avgPerDay}
          value={formatCurrency(avgPerDay, base)}
        />
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText
        variant='amount'
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
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
