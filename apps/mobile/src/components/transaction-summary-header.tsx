import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
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
  const heroColor = tone === 'income' ? c.primary : c.foreground;

  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <Text style={[styles.heroLabel, { color: c.mutedForeground }]}>
        {labels.total}
      </Text>
      <Text
        style={[styles.hero, { color: heroColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {tone === 'income' && total > 0 ? '+' : ''}
        {formatCurrency(total, base)}
      </Text>
      <Text style={[styles.heroHint, { color: c.mutedForeground }]}>
        {labels.overDays}
      </Text>

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
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useTheme();
  return (
    <View style={styles.stat}>
      <Text
        style={[styles.statValue, { color: c.foreground }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      <Text
        style={[styles.statLabel, { color: c.mutedForeground }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.half,
  },
  heroLabel: { fontFamily: Fonts.medium, fontSize: 13 },
  hero: { fontFamily: Fonts.bold, fontSize: 32, marginTop: Spacing.one },
  heroHint: { fontFamily: Fonts.regular, fontSize: 12 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.three,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, gap: Spacing.half, alignItems: 'flex-start' },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  statValue: { fontFamily: Fonts.semibold, fontSize: 15 },
  statLabel: { fontFamily: Fonts.regular, fontSize: 12 },
});
