import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui';
import type { Tier } from '@/features/categories/types';
import type { TierTotals } from '@/features/dashboard/types';
import { useTheme } from '@/hooks/use-theme';

const UNTIERED_COLOR = '#94a3b8';

interface TierBreakdownProps {
  tiers: Tier[];
  by_tier: TierTotals;
  uncategorized_spent: number;
  base_currency: CurrencyCode;
  /** Optional subtitle naming the active period (e.g. "Today"). */
  periodLabel?: string;
}

// Spend-by-tier breakdown for the selected period: a proportional stacked bar
// plus a legend. Untiered / uncategorized spend is folded into a trailing
// segment. No chart library — the bar is plain flexed Views (the time-series/pie
// charts are deferred to a follow-up).
export function TierBreakdown({
  tiers,
  by_tier,
  uncategorized_spent,
  base_currency: base,
  periodLabel,
}: TierBreakdownProps) {
  const { t } = useTranslation('dashboard');
  const c = useTheme();

  const rows = tiers
    .map((tier) => ({
      id: tier.id,
      name: tier.name,
      color: tier.color ?? UNTIERED_COLOR,
      amount: by_tier[tier.id] ?? 0,
    }))
    .filter((r) => r.amount > 0);

  if (uncategorized_spent > 0) {
    rows.push({
      id: '__uncategorized__',
      name: t('tier.untiered'),
      color: UNTIERED_COLOR,
      amount: uncategorized_spent,
    });
  }

  rows.sort((a, b) => b.amount - a.amount);
  const total = rows.reduce((acc, r) => acc + r.amount, 0);

  return (
    <Card padding={Spacing.three} style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>
          {t('tier.ariaLabel')}
        </Text>
        {periodLabel ? (
          <Text style={[styles.period, { color: c.mutedForeground }]}>
            {periodLabel}
          </Text>
        ) : null}
      </View>

      {total <= 0 ? (
        <Text style={[styles.empty, { color: c.mutedForeground }]}>
          {t('tier.empty')}
        </Text>
      ) : (
        <>
          <View style={[styles.bar, { backgroundColor: c.muted }]}>
            {rows.map((r) => (
              <View
                key={r.id}
                style={{
                  flex: r.amount / total,
                  backgroundColor: r.color,
                }}
              />
            ))}
          </View>
          <View style={styles.legend}>
            {rows.map((r) => (
              <View key={r.id} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <Text style={[styles.name, { color: c.foreground }]}>
                  {r.name}
                </Text>
                <Text style={[styles.amount, { color: c.mutedForeground }]}>
                  {formatCurrency(r.amount, base)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: { fontFamily: Fonts.semibold, fontSize: 16 },
  period: { fontFamily: Fonts.medium, fontSize: 13 },
  empty: { fontFamily: Fonts.regular, fontSize: 14 },
  bar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  legend: { gap: Spacing.two },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: Radius.pill },
  name: { flex: 1, fontFamily: Fonts.regular, fontSize: 14 },
  amount: { fontFamily: Fonts.medium, fontSize: 14 },
});
