import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BudgetStatus } from '@/features/budgets/types';

type BudgetMeterProps = {
  spent: number;
  target: number | null;
  pct: number | null;
  status: BudgetStatus;
  base: CurrencyCode;
};

// Spent-vs-target line: amounts + a color-coded progress bar capped at 100% (the
// "over" color signals overflow rather than overshooting the bar). RN counterpart
// to the web BudgetMeter.
export function BudgetMeter({
  spent,
  target,
  pct,
  status,
  base,
}: BudgetMeterProps) {
  const c = useTheme();
  const { t } = useTranslation('budgets');
  const value = pct == null ? 0 : Math.min(100, Math.round(pct * 100));

  const fillColor =
    status === 'over'
      ? c.destructive
      : status === 'approaching'
        ? c.warning
        : status === 'ok'
          ? c.primary
          : c.mutedForeground;

  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text style={[styles.spent, { color: c.foreground }]}>
          {formatCurrency(spent, base)}
        </Text>
        <Text style={[styles.target, { color: c.mutedForeground }]}>
          {target == null
            ? t('meter.noTarget')
            : t('meter.of', { amount: formatCurrency(target, base) })}
          {pct != null ? ` (${Math.round(pct * 100)}%)` : ''}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.muted }]}>
        <View
          style={[
            styles.fill,
            { width: `${value}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  labels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  spent: { fontFamily: Fonts.semibold, fontSize: 14 },
  target: { fontFamily: Fonts.regular, fontSize: 13 },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Radius.pill },
});
