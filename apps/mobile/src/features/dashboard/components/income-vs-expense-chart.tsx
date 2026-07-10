import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import type { CurrencyCode } from '@rinciku/core';
import type { TrendPoint } from '@rinciku/domain/dashboard';

import { AppText } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useChartColors, useTheme } from '@/hooks/use-theme';
import { compactAxisAmount } from './chart-utils';

const HEIGHT = 200;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PAD_LEFT = 56;
const PAD_RIGHT = 10;
const AXIS_FONT = 10;
const GROUP_GAP = 0.35; // fraction of a slot left empty between bucket groups

// Income vs spending as paired bars per time bucket. Two series (income, spent)
// share the Y scale; the X axis shows first / middle / last labels. Built on
// react-native-svg. A small legend sits above the plot.
export function IncomeVsExpenseChart({
  data,
  base,
}: {
  data: TrendPoint[];
  base: CurrencyCode;
}) {
  const { t } = useTranslation('dashboard');
  const c = useTheme();
  const chart = useChartColors();
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(e.nativeEvent.layout.width);

  const plotLeft = PAD_LEFT;
  const plotRight = width - PAD_RIGHT;
  const plotTop = PAD_TOP;
  const plotBottom = HEIGHT - PAD_BOTTOM;
  const plotW = Math.max(0, plotRight - plotLeft);
  const plotH = plotBottom - plotTop;

  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.spent]));
  const n = data.length;

  const slot = n > 0 ? plotW / n : plotW;
  const barW = (slot * (1 - GROUP_GAP)) / 2;
  const y = (v: number) => plotTop + (1 - v / max) * plotH;
  const barH = (v: number) => Math.max(0, plotBottom - y(v));

  const labelIndexes =
    n <= 1 ? [0] : n === 2 ? [0, 1] : [0, Math.floor((n - 1) / 2), n - 1];
  const gridRatios = [0, 0.5, 1];

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <LegendItem color={chart.income} label={t('charts.series.income')} />
        <LegendItem color={chart.spent} label={t('charts.series.spent')} />
      </View>

      <View style={styles.wrap} onLayout={onLayout}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {gridRatios.map((r) => {
              const gy = plotTop + (1 - r) * plotH;
              return (
                <G key={r}>
                  <Line
                    x1={plotLeft}
                    y1={gy}
                    x2={plotRight}
                    y2={gy}
                    stroke={chart.grid}
                    strokeWidth={1}
                  />
                  <SvgText
                    x={plotLeft - 6}
                    y={gy + AXIS_FONT / 3}
                    fill={c.mutedForeground}
                    fontSize={AXIS_FONT}
                    fontFamily={Fonts.regular}
                    textAnchor='end'
                  >
                    {compactAxisAmount(max * r, base)}
                  </SvgText>
                </G>
              );
            })}

            {data.map((d, i) => {
              const groupCenter = plotLeft + slot * i + slot / 2;
              const incomeX = groupCenter - barW;
              const spentX = groupCenter;
              return (
                <G key={d.bucket}>
                  <Rect
                    x={incomeX}
                    y={y(d.income)}
                    width={barW}
                    height={barH(d.income)}
                    fill={chart.income}
                    rx={2}
                  />
                  <Rect
                    x={spentX}
                    y={y(d.spent)}
                    width={barW}
                    height={barH(d.spent)}
                    fill={chart.spent}
                    rx={2}
                  />
                </G>
              );
            })}

            {labelIndexes.map((i) => {
              const groupCenter = plotLeft + slot * i + slot / 2;
              return (
                <SvgText
                  key={i}
                  x={groupCenter}
                  y={HEIGHT - 8}
                  fill={c.mutedForeground}
                  fontSize={AXIS_FONT}
                  fontFamily={Fonts.regular}
                  textAnchor='middle'
                >
                  {data[i]?.label ?? ''}
                </SvgText>
              );
            })}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant='caption' color='mutedForeground'>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  legend: { flexDirection: 'row', gap: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dot: { width: 10, height: 10, borderRadius: Radius.pill },
  wrap: { height: HEIGHT, width: '100%' },
});
