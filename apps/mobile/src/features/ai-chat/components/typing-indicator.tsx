import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AssistantMarker } from './assistant-marker';

const DOT_DURATION = 420;

// A single bouncing/fading dot. Staggered by `delay` so the three dots ripple.
function Dot({ delay }: { delay: number }) {
  const c = useTheme();
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: DOT_DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: DOT_DURATION,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1
      )
    );
  }, [v, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + v.value * 0.65,
    transform: [{ translateY: v.value * -3 }],
  }));

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: c.mutedForeground }, style]}
    />
  );
}

// Shown while a turn is in flight (one or more model round-trips + auto-executed
// read tools). Renders under the shared assistant marker with rippling dots so
// the in-flight turn reads as a *forming* assistant message that flows into the
// finished reply.
export function TypingIndicator() {
  const { t } = useTranslation('aiChat');
  return (
    <View
      style={styles.container}
      accessibilityRole='text'
      accessibilityLabel={t('message.thinking')}
    >
      <AssistantMarker />
      <View style={styles.dots}>
        <Dot delay={0} />
        <Dot delay={140} />
        <Dot delay={280} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
  },
});
