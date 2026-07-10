import { StyleSheet, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { AppText, Card } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

export type SummaryLabels = {
  /** Hero label, e.g. "Total spent" / "Total income". */
  total: string;
  /** Pre-pluralized transaction count for the chip, e.g. "12 transactions". */
  count: string;
  avgPerDay: string;
  /** Pluralized "over N days" hint shown under the hero. */
  overDays: string;
};

// Shared summary header for the expenses + incomes lists, mirroring the
// dashboard BudgetHero: a soft tone wash keeps the card from reading monotone,
// the count rides in a pill, and the hero is one ink (expense) or `positive`
// green (income) number — color that means direction. Never a lime `primary`
// text fill.
export function TransactionSummaryHeader({
  total,
  days,
  base,
  tone,
  labels,
}: {
  total: number;
  days: number;
  base: CurrencyCode;
  tone: 'expense' | 'income';
  labels: SummaryLabels;
}) {
  const c = useTheme();
  const avgPerDay = days > 0 ? total / days : 0;

  // Direction color: income green; expense a muted rose so it reads as "money
  // out" without alarm, and so the screen's lime stays reserved for the CTA /
  // active tab. The hero number stays ink on the expense side.
  const accent = tone === 'income' ? c.positive : c.expense;
  const heroColor = tone === 'income' ? c.positive : c.foreground;

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: withAlpha(accent, '14'),
          borderColor: withAlpha(accent, '33'),
        },
      ]}
    >
      <View style={styles.headerRow}>
        <AppText variant='amountSmall' color='mutedForeground'>
          {labels.total}
        </AppText>
        <View
          style={[styles.chip, { backgroundColor: withAlpha(accent, '26') }]}
        >
          <AppText variant='amountSmall' style={{ color: accent }}>
            {labels.count}
          </AppText>
        </View>
      </View>

      <AppText
        variant='hero'
        style={[styles.hero, { color: heroColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {formatCurrency(total, base)}
      </AppText>
      <AppText variant='caption' color='mutedForeground'>
        {labels.overDays}
      </AppText>

      <View
        style={[styles.divider, { backgroundColor: withAlpha(accent, '33') }]}
      />

      <View style={styles.statRow}>
        <AppText variant='label' color='mutedForeground'>
          {labels.avgPerDay}
        </AppText>
        <AppText variant='amount' style={styles.statValue} numberOfLines={1}>
          {formatCurrency(avgPerDay, base)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.half },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  hero: { marginTop: Spacing.one },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.three,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  statValue: { flexShrink: 1, textAlign: 'right' },
});
