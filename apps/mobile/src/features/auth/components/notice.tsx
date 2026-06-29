import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Inline status banner used across the auth screens (reset/deleted notices,
// "check your email", error summaries).
export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error';
  children: ReactNode;
}) {
  const c = useTheme();
  const borderColor = tone === 'error' ? c.destructive : c.primary;
  const textColor = tone === 'error' ? c.destructive : c.foreground;

  return (
    <View style={[styles.box, { borderColor, backgroundColor: c.muted }]}>
      <Text selectable style={[styles.text, { color: textColor }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  text: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
});
