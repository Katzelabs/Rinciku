import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Themed React Native pill button. Composes with RN layout (full-width in a
 * stretch column, `flex` in a row) reliably on both platforms.
 *
 * Note: a native SwiftUI button was tried here but couldn't be made to stretch
 * full-width dependably via the @expo/ui `Host` (it either stayed compact or
 * grew vertically), so this stays RN. Native SwiftUI is used for the compact
 * controls where it's reliable — `Segmented` and the `systemImage` path of
 * `Pill`/`IconButton`.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const c = useTheme();

  const bg: Record<Variant, string> = {
    primary: c.primary,
    secondary: c.secondary,
    // A `card` fill (not transparent) so the bordered button reads as a raised
    // control against the warm paper ground instead of dissolving into it.
    outline: c.card,
    ghost: 'transparent',
    destructive: c.destructive,
  };
  const fg: Record<Variant, string> = {
    primary: c.primaryForeground,
    secondary: c.secondaryForeground,
    outline: c.foreground,
    ghost: c.foreground,
    destructive: c.destructiveForeground,
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole='button'
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        (variant === 'primary' || variant === 'outline') && !isDisabled
          ? styles.elevated
          : null,
        {
          backgroundColor: bg[variant],
          borderColor: variant === 'outline' ? c.border : 'transparent',
          borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth * 2 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg[variant]} /> : null}
      <Text style={[styles.label, { color: fg[variant] }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 50,
    paddingHorizontal: Spacing.four,
    // Fully rounded (pill) to match the web Button, whose `rounded-2xl` on a
    // short 32px control reads as a pill. Our taller controls need `pill`.
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
  },
  elevated: { boxShadow: Shadow.sm },
  label: { fontFamily: Fonts.semibold, fontSize: 16 },
});
