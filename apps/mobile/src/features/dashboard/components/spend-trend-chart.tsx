import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Path, Text as SvgText } from 'react-native-svg';

import type { CurrencyCode } from '@rinciku/core';
import type { TrendPoint } from '@rinciku/domain/dashboard';

import { Fonts } from '@/constants/theme';
import { useChartColors, useTheme } from '@/hooks/use-theme';
import { compactAxisAmount } from './chart-utils';

const HEIGHT = 200;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PAD_LEFT = 56;
const PAD_RIGHT = 10;
const AXIS_FONT = 10;

// Spend over the selected range as a filled area under a line. X axis shows the
// first / middle / last bucket labels; the Y axis shows three compact-currency
// gridlines. Built on react-native-svg (no chart library) — the plot width is
// measured via onLayout so it fills the card.
export function SpendTrendChart({
  data,
  base,
}: {
  data: TrendPoint[];
  base: CurrencyCode;
}) {
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

  const max = Math.max(1, ...data.map((d) => d.spent));
  const n = data.length;

  const x = (i: number) =>
    n <= 1 ? plotLeft + plotW / 2 : plotLeft + (i / (n - 1)) * plotW;
  const y = (v: number) => plotTop + (1 - v / max) * plotH;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.spent)}`)
    .join(' ');
  const areaPath =
    n > 0
      ? `${linePath} L ${x(n - 1)} ${plotBottom} L ${x(0)} ${plotBottom} Z`
      : '';

  // First / middle / last labels only, so ticks never collide on a narrow phone.
  const labelIndexes =
    n <= 1 ? [0] : n === 2 ? [0, 1] : [0, Math.floor((n - 1) / 2), n - 1];

  const gridRatios = [0, 0.5, 1];

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {/* Y gridlines + compact-currency labels */}
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

          {areaPath ? (
            <Path d={areaPath} fill={chart.spent} fillOpacity={0.18} />
          ) : null}
          {linePath ? (
            <Path
              d={linePath}
              stroke={chart.spent}
              strokeWidth={2}
              fill='none'
              strokeLinejoin='round'
              strokeLinecap='round'
            />
          ) : null}

          {/* X axis labels */}
          {labelIndexes.map((i) => (
            <SvgText
              key={i}
              x={x(i)}
              y={HEIGHT - 8}
              fill={c.mutedForeground}
              fontSize={AXIS_FONT}
              fontFamily={Fonts.regular}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
            >
              {data[i]?.label ?? ''}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: HEIGHT, width: '100%' },
});
