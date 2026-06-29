import { type ReactNode } from 'react';
import { Text } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// A small, named icon set shared by the auth UI. SymbolView renders a real SF
// Symbol on iOS and the mapped Material Symbol on Android (see
// https://docs.expo.dev/versions/v56.0.0/sdk/symbols/). The `fallback` keeps a
// readable glyph on any platform where a symbol can't resolve.
const ICONS = {
  envelope: { ios: 'envelope', android: 'mail', fallback: '✉' },
  lock: { ios: 'lock', android: 'lock', fallback: '🔒' },
  eye: { ios: 'eye', android: 'visibility', fallback: '👁' },
  'eye.slash': { ios: 'eye.slash', android: 'visibility_off', fallback: '🙈' },
  'checkmark.circle.fill': {
    ios: 'checkmark.circle.fill',
    android: 'check_circle',
    fallback: '✓',
  },
  circle: { ios: 'circle', android: 'radio_button_unchecked', fallback: '○' },
  'exclamationmark.triangle.fill': {
    ios: 'exclamationmark.triangle.fill',
    android: 'warning',
    fallback: '⚠',
  },
  'info.circle.fill': {
    ios: 'info.circle.fill',
    android: 'info',
    fallback: 'ⓘ',
  },
  globe: { ios: 'globe', android: 'language', fallback: '🌐' },
  checkmark: { ios: 'checkmark', android: 'check', fallback: '✓' },
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  /** Defaults to the muted foreground token. */
  color?: string;
}

export function Icon({ name, size = 18, color }: IconProps): ReactNode {
  const c = useTheme();
  const tint = color ?? c.mutedForeground;
  const def = ICONS[name];

  return (
    <SymbolView
      name={{ ios: def.ios, android: def.android }}
      size={size}
      tintColor={tint}
      fallback={
        <Text
          style={{
            fontFamily: Fonts.regular,
            fontSize: size,
            lineHeight: size + 2,
            color: tint,
          }}
        >
          {def.fallback}
        </Text>
      }
    />
  );
}
