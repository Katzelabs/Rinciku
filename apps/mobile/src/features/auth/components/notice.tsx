import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';

// Append an alpha channel to a #RRGGBB hex; returns the color unchanged if it
// isn't a 6-digit hex (e.g. the dark-mode rgba border tokens).
function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex;
}

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
  const accent = tone === 'error' ? c.destructive : c.primary;
  const textColor = tone === 'error' ? c.destructive : c.foreground;

  return (
    <View
      style={[
        styles.box,
        { borderColor: withAlpha(accent, '40'), backgroundColor: withAlpha(accent, '14') },
      ]}
    >
      <Icon
        name={tone === 'error' ? 'exclamationmark.triangle.fill' : 'info.circle.fill'}
        size={18}
        color={accent}
      />
      <Text selectable style={[styles.text, { color: textColor }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  text: { flex: 1, fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
});
