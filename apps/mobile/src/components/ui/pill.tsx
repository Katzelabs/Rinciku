import { type ComponentProps, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Button as SwiftButton, Host } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  labelStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppText } from './text';

type Tone = 'muted' | 'primary' | 'outline';

/** SF Symbol name (derived from the native Button's prop type — no direct
 * `sf-symbols-typescript` import, which isn't linked under pnpm). */
type SystemImage = NonNullable<
  ComponentProps<typeof SwiftButton>['systemImage']
>;

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
  /**
   * SF Symbol for the label's leading icon. When provided, iOS renders a real
   * native SwiftUI `Button` (Liquid Glass on iOS 26+); Android/RN uses `leading`.
   * Omit it (e.g. dropdown pills with a trailing chevron) to force the RN path.
   */
  systemImage?: SystemImage;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fully-rounded pill button — the shared shape behind filter dropdowns, the
 * "Add" affordance, and inline chips. iOS renders a native SwiftUI button when a
 * `systemImage` is supplied; otherwise (and on Android) it renders the themed RN
 * pill.
 */
export function Pill(props: PillProps) {
  if (Platform.OS === 'ios' && props.systemImage) {
    return <NativePill {...props} systemImage={props.systemImage} />;
  }
  return <RNPill {...props} />;
}

function nativeButtonStyle(tone: Tone, glass: boolean) {
  const prominent = tone === 'primary';
  if (glass) return prominent ? 'glassProminent' : 'glass';
  return prominent ? 'borderedProminent' : 'bordered';
}

function NativePill({
  label,
  onPress,
  tone = 'muted',
  fill = false,
  disabled = false,
  systemImage,
  style,
}: PillProps & { systemImage: SystemImage }) {
  const c = useTheme();
  const glass = isLiquidGlassAvailable();
  const tintColor = tone === 'primary' ? c.primary : c.secondaryForeground;
  return (
    <Host
      matchContents={{ vertical: true }}
      style={[fill && styles.fill, style]}
    >
      <SwiftButton
        label={label}
        systemImage={systemImage}
        onPress={disabled ? undefined : onPress}
        modifiers={[
          buttonStyle(nativeButtonStyle(tone, glass)),
          controlSize('regular'),
          tint(tintColor),
          disabledModifier(disabled),
        ]}
      />
    </Host>
  );
}

function RNPill({
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
    tone === 'primary'
      ? c.primary
      : tone === 'outline'
        ? 'transparent'
        : c.muted;
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
        tone === 'outline' && {
          borderColor: c.border,
          borderWidth: Border.hairline,
        },
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
  /** SF Symbol for the native iOS button; when provided, iOS renders a native
   * SwiftUI icon button. Android/RN uses `children`. */
  systemImage?: SystemImage;
}

/** Square, fully-rounded icon-only button (e.g. the receipt-capture action). */
export function IconButton(props: IconButtonProps) {
  if (Platform.OS === 'ios' && props.systemImage) {
    return <NativeIconButton {...props} systemImage={props.systemImage} />;
  }
  return <RNIconButton {...props} />;
}

function NativeIconButton({
  onPress,
  accessibilityLabel,
  tone = 'muted',
  systemImage,
}: IconButtonProps & { systemImage: SystemImage }) {
  const c = useTheme();
  const glass = isLiquidGlassAvailable();
  // `primary` renders a filled/prominent button (lime fill, contrasting glyph) so
  // the send action reads as the primary CTA — not just a lime-tinted glass icon.
  const tintColor = tone === 'primary' ? c.primary : c.foreground;
  return (
    <Host matchContents>
      <SwiftButton
        label={accessibilityLabel}
        systemImage={systemImage}
        onPress={onPress}
        modifiers={[
          buttonStyle(nativeButtonStyle(tone, glass)),
          labelStyle('iconOnly'),
          controlSize('regular'),
          tint(tintColor),
        ]}
      />
    </Host>
  );
}

function RNIconButton({
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
        {
          width: size,
          height: size,
          backgroundColor: bg,
          opacity: pressed ? 0.6 : 1,
        },
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
