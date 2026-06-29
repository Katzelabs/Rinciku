import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { type IconName } from '@/components/icon';
import { BrandHeader } from '@/features/auth/components/brand-header';
import { useTheme } from '@/hooks/use-theme';

interface AuthScreenShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Optional contextual badge icon shown in place of the brand lockup. */
  badge?: IconName;
}

// Shared scaffold for the auth screens: keyboard-avoiding scroll view, safe-area
// aware (the (auth) group hides the navigator header, so we pad insets here),
// centered max-width column, a brand header, and an optional footer. The column
// fades/slides in on mount for a polished first frame. Uses the built-in RN
// Animated API (no Reanimated babel plugin required).
export function AuthScreenShell({
  title,
  description,
  children,
  footer,
  badge,
}: AuthScreenShellProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const animatedStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.five,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}
      >
        <Animated.View style={[styles.column, animatedStyle]}>
          <BrandHeader title={title} description={description} badge={badge} />
          {children}
          {footer ? <Animated.View style={styles.footer}>{footer}</Animated.View> : null}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  column: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  footer: { marginTop: Spacing.two, gap: Spacing.three, alignItems: 'center' },
});
