import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';
import type { BreakdownItem } from '@rinciku/domain/dashboard';

import { CategoryBadge } from '@/components/category-badge';
import { AppText, Card } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

const MAX_TILES = 4;

// A compact bento of the top spending categories for the selected period. Each
// tile carries the emoji chip + per-category color + amount + share of spend —
// scannable by color/shape before text, per the design system. Fed by the
// range-scoped category breakdown (already sorted desc by amount).
export function TopCategories({
  items,
  base,
}: {
  items: BreakdownItem[];
  base: CurrencyCode;
}) {
  const { t } = useTranslation('dashboard');

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const top = items.slice(0, MAX_TILES);
  if (top.length === 0 || total <= 0) return null;

  return (
    <Card padding={Spacing.three} style={styles.card}>
      <AppText variant='heading'>{t('topCategories.title')}</AppText>
      <View style={styles.grid}>
        {top.map((item) => (
          <Tile key={item.id} item={item} total={total} base={base} />
        ))}
      </View>
    </Card>
  );
}

function Tile({
  item,
  total,
  base,
}: {
  item: BreakdownItem;
  total: number;
  base: CurrencyCode;
}) {
  const c = useTheme();
  const percent = total > 0 ? Math.round((item.amount / total) * 100) : 0;
  return (
    <View
      style={[styles.tile, { backgroundColor: withAlpha(item.color, '14') }]}
    >
      <View style={styles.tileHeader}>
        <CategoryBadge
          icon={item.icon}
          color={item.color}
          seed={item.id}
          size={32}
        />
        <AppText variant='caption' style={{ color: item.color }}>
          {percent}%
        </AppText>
      </View>
      <AppText variant='label' numberOfLines={1} style={styles.name}>
        {item.name}
      </AppText>
      <AppText
        variant='amountSmall'
        style={{ color: c.foreground }}
        numberOfLines={1}
      >
        {formatCurrency(item.amount, base)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: {
    // Two per row: half the card width minus half the row gap.
    flexBasis: '48%',
    flexGrow: 1,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: { marginTop: Spacing.one },
});
