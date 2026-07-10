import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';
import type {
  BreakdownItem,
  CategoryBreakdown,
} from '@rinciku/domain/dashboard';

import { AppText } from '@/components/ui';
import { Segmented } from '@/components/segmented';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 168;
const R_OUTER = 80;
const R_INNER = 50;
const CENTER = SIZE / 2;

type Mode = 'category' | 'tier';

// Spend distribution as a donut with a category/tier toggle and a percent +
// amount legend. Slice colors come from each item's own `.color`. Built on
// react-native-svg (arc paths); a single 100% slice renders as a full ring.
export function CategoryBreakdownChart({
  data,
  base,
}: {
  data: CategoryBreakdown;
  base: CurrencyCode;
}) {
  const { t } = useTranslation('dashboard');
  const c = useTheme();
  const [mode, setMode] = useState<Mode>('category');

  const items = mode === 'category' ? data.byCategory : data.byTier;
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const options = [
    { key: 'category' as const, label: t('charts.breakdownTabs.byCategory') },
    { key: 'tier' as const, label: t('charts.breakdownTabs.byTier') },
  ];

  return (
    <View style={styles.container}>
      <Segmented options={options} value={mode} onChange={setMode} />

      {items.length === 0 || total <= 0 ? (
        <View style={[styles.empty, { borderColor: c.border }]}>
          <AppText variant='caption' color='mutedForeground'>
            {t('charts.emptyDefault')}
          </AppText>
        </View>
      ) : (
        <>
          <View style={styles.donutWrap}>
            <Donut items={items} total={total} />
          </View>
          <View style={styles.legend}>
            {items.map((item) => (
              <LegendRow key={item.id} item={item} total={total} base={base} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function Donut({ items, total }: { items: BreakdownItem[]; total: number }) {
  // A single non-zero slice can't be drawn with one SVG arc (start == end), so
  // render it as a full stroked ring instead.
  if (items.length === 1) {
    return (
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={(R_OUTER + R_INNER) / 2}
          stroke={items[0].color}
          strokeWidth={R_OUTER - R_INNER}
          fill='none'
        />
      </Svg>
    );
  }

  return (
    <Svg width={SIZE} height={SIZE}>
      {buildSegments(items, total).map((seg) => (
        <Path key={seg.id} d={seg.path} fill={seg.color} />
      ))}
    </Svg>
  );
}

// Precompute each slice's arc path with a running start angle. Kept out of the
// render map so the React Compiler doesn't flag the angle accumulation.
function buildSegments(
  items: BreakdownItem[],
  total: number
): { id: string; color: string; path: string }[] {
  const segments: { id: string; color: string; path: string }[] = [];
  let angle = -Math.PI / 2; // start at 12 o'clock
  for (const item of items) {
    const sweep = (item.amount / total) * Math.PI * 2;
    segments.push({
      id: item.id,
      color: item.color,
      path: arcPath(angle, angle + sweep),
    });
    angle += sweep;
  }
  return segments;
}

// Donut segment between two angles (radians), as an outer arc + inner arc.
function arcPath(a0: number, a1: number): string {
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  const x0o = CENTER + R_OUTER * Math.cos(a0);
  const y0o = CENTER + R_OUTER * Math.sin(a0);
  const x1o = CENTER + R_OUTER * Math.cos(a1);
  const y1o = CENTER + R_OUTER * Math.sin(a1);
  const x1i = CENTER + R_INNER * Math.cos(a1);
  const y1i = CENTER + R_INNER * Math.sin(a1);
  const x0i = CENTER + R_INNER * Math.cos(a0);
  const y0i = CENTER + R_INNER * Math.sin(a0);
  return [
    `M ${x0o} ${y0o}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${largeArc} 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${R_INNER} ${R_INNER} 0 ${largeArc} 0 ${x0i} ${y0i}`,
    'Z',
  ].join(' ');
}

function LegendRow({
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
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: item.color }]} />
      <AppText variant='label' style={styles.name} numberOfLines={1}>
        {item.name}
      </AppText>
      <AppText variant='caption' color='mutedForeground'>
        {percent}%
      </AppText>
      <AppText variant='label' style={{ color: c.mutedForeground }}>
        {formatCurrency(item.amount, base)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  donutWrap: { alignItems: 'center' },
  legend: { gap: Spacing.two },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: Radius.pill },
  name: { flex: 1 },
  empty: {
    height: 140,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
