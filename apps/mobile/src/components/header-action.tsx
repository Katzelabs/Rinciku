import type { ComponentProps, ComponentType } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Button, Host, Image } from '@expo/ui/swift-ui';
import {
  accessibilityLabel as a11yLabel,
  buttonStyle,
  imageScale,
  tint,
} from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/hooks/use-theme';

/** SF Symbol name, derived from the native Image's own prop type (no direct
 * `sf-symbols-typescript` import — it isn't linked into the app under pnpm). */
type SystemImage = NonNullable<ComponentProps<typeof Image>['systemName']>;

interface HeaderActionProps {
  onPress: () => void;
  accessibilityLabel: string;
  /** SF Symbol for the native iOS nav-bar button (e.g. `'plus'`). */
  systemImage: SystemImage;
  /** lucide icon used for the Android/themed fallback button. */
  icon: ComponentType<{ size?: number; color?: string }>;
}

/**
 * A single nav-bar action, adaptive per platform behind one contract:
 * iOS renders a real SwiftUI `Button` (via `@expo/ui/swift-ui`) so it matches
 * the native header chrome; Android renders a themed lucide `Pressable`. Both
 * tint with the brand primary. Drop it into a `Stack.Screen` `headerRight`.
 *
 * This is the standard for header actions — it replaces the lucide-only
 * `HeaderAddButton` so the affordance is native on iOS everywhere (previously
 * only the expenses overview used native header buttons).
 */
export function HeaderAction({
  onPress,
  accessibilityLabel,
  systemImage,
  icon: Icon,
}: HeaderActionProps) {
  const c = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <Host matchContents>
        <Button
          onPress={onPress}
          modifiers={[
            buttonStyle('borderless'),
            imageScale('large'),
            tint(c.primary),
            a11yLabel(accessibilityLabel),
          ]}
        >
          <Image systemName={systemImage} />
        </Button>
      </Host>
    );
  }

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon size={24} color={c.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});
