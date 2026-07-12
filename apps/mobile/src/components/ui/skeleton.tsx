import { useEffect } from 'react';
import {
  StyleSheet,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PULSE_DURATION = 800;

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  /** Corner radius. Defaults to `Radius.md`; pass `Radius.pill` for circles. */
  radius?: number;
  /** Set false for a static muted block (no opacity pulse). */
  pulse?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * First-load placeholder block — the native counterpart of the web
 * `ui/skeleton` (muted rounded block + opacity pulse, no shimmer gradient).
 * Use it only where the loaded layout is known and stable (list rows, chart
 * plots); indeterminate or refetch waits keep `ActivityIndicator` /
 * pull-to-refresh. Compose feature-shaped skeletons out of this primitive
 * (e.g. `TransactionListSkeleton`) rather than hand-rolling muted views.
 */
export function Skeleton({
  width,
  height,
  radius = Radius.md,
  pulse = true,
  style,
}: SkeletonProps) {
  const c = useTheme();
  const v = useSharedValue(0);

  useEffect(() => {
    if (!pulse) return;
    v.value = withRepeat(
      withTiming(1, {
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    return () => cancelAnimation(v);
  }, [v, pulse]);

  const animated = useAnimatedStyle(() => ({
    opacity: pulse ? 1 - v.value * 0.55 : 1,
  }));

  return (
    <Animated.View
      accessible={false}
      style={[
        styles.block,
        { backgroundColor: c.muted, borderRadius: radius, width, height },
        animated,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: { borderCurve: 'continuous' },
});
