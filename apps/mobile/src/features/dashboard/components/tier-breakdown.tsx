import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { MonthlySummary } from '@/features/dashboard/types';
import { useTheme } from '@/hooks/use-theme';

const UNTIERED_COLOR = '#94a3b8';

// Spend-by-tier breakdown: a proportional stacked bar plus a legend. Untiered /
// uncategorized spend is folded into a trailing segment. No chart library — the
// bar is plain flexed Views (the time-series/pie charts are deferred to a
// follow-up).
export function TierBreakdown({ summary }: { summary: MonthlySummary }) {
  const { t } = useTranslation('dashboard');
  const c = useTheme();
  const base = summary.base_currency;

  const rows = summary.tiers
    .map((tier) => ({
      id: tier.id,
      name: tier.name,
      color: tier.color ?? UNTIERED_COLOR,
      amount: summary.by_tier[tier.id] ?? 0,
    }))
    .filter((r) => r.amount > 0);

  if (summary.uncategorized_spent > 0) {
    rows.push({
      id: '__uncategorized__',
      name: t('tier.untiered'),
      color: UNTIERED_COLOR,
      amount: summary.uncategorized_spent,
    });
  }

  rows.sort((a, b) => b.amount - a.amount);
  const total = rows.reduce((acc, r) => acc + r.amount, 0);

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.title, { color: c.foreground }]}>
        {t('tier.ariaLabel')}
      </Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  title: { fontFamily: Fonts.semibold, fontSize: 16 },
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
