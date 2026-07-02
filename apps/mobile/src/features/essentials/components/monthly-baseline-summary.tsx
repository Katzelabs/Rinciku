import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';
import type { Baseline } from '@rinciku/domain/essentials';
import type { Tables } from '@rinciku/db';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

type Tier = Tables<'tiers'>;

// Monthly baseline total + per-tier breakdown. The total powers the AI's
// baseline; tiers with no essentials are omitted.
export function MonthlyBaselineSummary({
  baseline,
  tiers,
  base,
}: {
  baseline: Baseline;
  tiers: Tier[];
  base: CurrencyCode;
}) {
  const c = useTheme();
  const { t } = useTranslation('essentials');

  const rows = tiers
    .map((tier) => ({ tier, amount: baseline.by_tier[tier.id] ?? 0 }))
    .filter((r) => r.amount > 0);

  return (
    <Card padding={Spacing.three} style={styles.card}>
      <View style={styles.totalRow}>
        <Text style={[styles.label, { color: c.mutedForeground }]}>
          {t('summary.label')}
        </Text>
        <Text style={[styles.total, { color: c.foreground }]}>
          {formatCurrency(baseline.total_base, base)}
        </Text>
      </View>
      {rows.length > 0 ? (
        <View style={styles.tierList}>
          {rows.map(({ tier, amount }) => (
            <View key={tier.id} style={styles.tierRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: tier.color ?? c.mutedForeground },
                ]}
              />
              <Text style={[styles.tierName, { color: c.foreground }]}>
                {tier.name}
              </Text>
              <Text style={[styles.tierAmount, { color: c.mutedForeground }]}>
                {formatCurrency(amount, base)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontFamily: Fonts.medium, fontSize: 14 },
  total: { fontFamily: Fonts.bold, fontSize: 20 },
  tierList: { gap: Spacing.two },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: Radius.pill },
  tierName: { flex: 1, fontFamily: Fonts.regular, fontSize: 14 },
  tierAmount: { fontFamily: Fonts.medium, fontSize: 14 },
});
