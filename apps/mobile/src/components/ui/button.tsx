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
    outline: 'transparent',
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
        variant === 'primary' && !isDisabled ? styles.elevated : null,
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
