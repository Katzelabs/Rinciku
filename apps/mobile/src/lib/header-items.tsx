import type {
  NativeStackHeaderItem,
  NativeStackNavigationOptions,
} from 'expo-router';
import {
  type ColorValue,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

/**
 * Platform bridge for native header actions. expo-router's
 * `unstable_headerLeftItems`/`unstable_headerRightItems` render real
 * UIBarButtonItems on iOS but are silently dropped on Android
 * (react-native-screens has no Android support for them), which left every
 * header button missing there. This helper keeps the same item descriptors:
 * iOS passes them through to the unstable_ API unchanged; Android renders the
 * `button`/`custom` items as a classic `headerLeft`/`headerRight` row of
 * themed Pressables reusing the same rasterized MDI icons
 * (`@/lib/header-icons`). Spread the result into `Stack.Screen` options:
 * `...headerItems('right', () => [...])`.
 *
 * Items are provided as a factory (matching the unstable_ API) so descriptors
 * whose `onPress` reads a ref are built lazily, not during the screen's render
 * — the React Compiler's `react-hooks/refs` rule rejects the eager form.
 */
export function headerItems(
  placement: 'left' | 'right',
  items: () => NativeStackHeaderItem[]
): NativeStackNavigationOptions {
  if (Platform.OS === 'ios') {
    return placement === 'left'
      ? { unstable_headerLeftItems: items }
      : { unstable_headerRightItems: items };
  }
  const row = () => <HeaderItemsRow placement={placement} items={items()} />;
  return placement === 'left' ? { headerLeft: row } : { headerRight: row };
}

function HeaderItemsRow({
  placement,
  items,
}: {
  placement: 'left' | 'right';
  items: NativeStackHeaderItem[];
}) {
  const c = useTheme();

  return (
    // The native Android header puts the title flush against the headerLeft
    // view, so left rows carry an end margin to breathe.
    <View style={[styles.row, placement === 'left' && styles.rowLeft]}>
      {items.map((item, i) => {
        if (item.type === 'custom') {
          return <View key={i}>{item.element}</View>;
        }
        // `menu`/`spacing` items aren't used by any screen; only buttons get
        // an Android rendering.
        if (item.type !== 'button') return null;

        // "Prominent" (iOS 26 tinted bar button) maps to a translucent lime
        // pill with foreground ink — lime stays an accent wash, never a fill,
        // and ink survives both color schemes (the iOS path tints the glyph
        // with `tintColor` instead, where the system supplies the backdrop).
        const prominent = item.variant === 'prominent';
        const tint: ColorValue = prominent
          ? c.foreground
          : (item.tintColor ?? c.foreground);

        return (
          <Pressable
            key={i}
            accessibilityRole='button'
            accessibilityLabel={item.accessibilityLabel ?? item.label}
            disabled={item.disabled}
            hitSlop={6}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.button,
              prominent && {
                backgroundColor: withAlpha(c.primary, '33'),
                borderRadius: Radius.pill,
              },
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            {item.icon?.type === 'image' ? (
              <Image
                source={item.icon.source}
                style={[styles.icon, { tintColor: tint }]}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowLeft: { marginRight: Spacing.three },
  // 44pt minimum touch target; icons center inside it.
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 24, height: 24 },
});
