import { type ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScreenScrollProps extends Omit<ScrollViewProps, 'refreshControl'> {
  children: ReactNode;
  /** Gap between direct children of the content column. Defaults to `three`. */
  gap?: number;
  /** When provided, wires a standardized pull-to-refresh control. */
  onRefresh?: () => void;
  refreshing?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Standard scrolling screen container. Centralizes the copy-pasted content
 * padding (`four` / bottom `six`), `contentInsetAdjustmentBehavior`,
 * keyboard handling, and the pull-to-refresh tint (previously drifting between
 * `primary` and `mutedForeground`).
 */
export function ScreenScroll({
  children,
  gap = Spacing.three,
  onRefresh,
  refreshing = false,
  contentContainerStyle,
  ...rest
}: ScreenScrollProps) {
  const c = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={[styles.content, { gap }, contentContainerStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.mutedForeground}
          />
        ) : undefined
      }
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

/** Non-scrolling screen container — just the themed background + flex. */
export function Screen({ style, ...rest }: ViewProps) {
  const c = useTheme();
  return (
    <View
      style={[styles.screen, { backgroundColor: c.background }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    padding: Spacing.four,
    // Clear the translucent NativeTabs bar (a flat 64px used to be shorter than
    // the Android bar, so list/dashboard content slid under it). BottomTabInset
    // is the bar's height per platform (ios 50 / android 80) + breathing room.
    paddingBottom: BottomTabInset + Spacing.four,
  },
});
