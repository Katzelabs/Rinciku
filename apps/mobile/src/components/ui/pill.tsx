import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppText } from './text';

type Tone = 'muted' | 'primary' | 'outline';

interface PillProps {
  label: string;
  onPress: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  tone?: Tone;
  /** For `muted` tone: brighten the label to `foreground` when active. */
  active?: boolean;
  /** Stretch to fill the row (`flex: 1`). */
  fill?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fully-rounded pill button — the shared shape behind filter dropdowns, the
 * "Add" affordance, and other inline chips. Replaces the hand-rolled `addPill` /
 * `DropdownPill` / muted `shell` / bordered `PillButton` styles.
 */
export function Pill({
  label,
  onPress,
  leading,
  trailing,
  tone = 'muted',
  active = false,
  fill = false,
  disabled = false,
  accessibilityLabel,
  style,
}: PillProps) {
  const c = useTheme();
  const bg =
    tone === 'primary' ? c.primary : tone === 'outline' ? 'transparent' : c.muted;
  const labelColor: 'primaryForeground' | 'foreground' | 'mutedForeground' =
    tone === 'primary'
      ? 'primaryForeground'
      : tone === 'outline' || active
        ? 'foreground'
        : 'mutedForeground';

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        fill && styles.fill,
        tone === 'outline' && { borderColor: c.border, borderWidth: Border.hairline },
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      {leading}
      <AppText
        variant='bodyMedium'
        color={labelColor}
        numberOfLines={1}
        style={fill ? styles.fillLabel : undefined}
      >
        {label}
      </AppText>
      {trailing}
    </Pressable>
  );
}

interface IconButtonProps {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  tone?: Tone;
}

/** Square, fully-rounded icon-only button (e.g. the receipt-capture action). */
export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  size = 34,
  tone = 'muted',
}: IconButtonProps) {
  const c = useTheme();
  const bg = tone === 'primary' ? c.primary : c.muted;
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, backgroundColor: bg, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  fill: { flex: 1 },
  fillLabel: { flex: 1 },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
  },
});
