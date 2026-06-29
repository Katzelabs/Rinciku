import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * Rinciku brand mark — three descending lines inside a rounded square.
 * Ported 1:1 from the web `LogoMark` (apps/web/src/components/shared/logo.tsx):
 * the square uses `primary` and the bars `primaryForeground`, so it tracks the
 * palette and flips automatically in dark mode. Built from plain Views (no SVG
 * dependency); proportions mirror the web 100×100 viewBox.
 */
export function LogoMark({ size = 44 }: { size?: number }) {
  const c = useTheme();
  const bar = (width: number, opacity: number) => (
    <View
      style={{
        width: size * width,
        height: size * 0.12,
        borderRadius: size * 0.06,
        borderCurve: 'continuous',
        backgroundColor: c.primaryForeground,
        opacity,
      }}
    />
  );

  return (
    <View
      style={[
        styles.square,
        {
          width: size,
          height: size,
          borderRadius: size * 0.25,
          paddingLeft: size * 0.16,
          gap: size * 0.06,
          backgroundColor: c.primary,
        },
      ]}
    >
      {bar(0.68, 0.93)}
      {bar(0.48, 0.65)}
      {bar(0.3, 0.37)}
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
});
