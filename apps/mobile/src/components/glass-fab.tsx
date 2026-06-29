import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 60;

interface GlassFabProps {
  onPress: () => void;
  accessibilityLabel: string;
}

// Floating action button rendered in Liquid Glass on iOS 26+, falling back to a
// solid branded circle elsewhere (older iOS / Android). Glass belongs on the
// chrome layer per Apple's HIG, so the icon/content stays solid.
export function GlassFab({ onPress, accessibilityLabel }: GlassFabProps) {
  const c = useTheme();
  const glass = isLiquidGlassAvailable();

  const inner = (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.press, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={[styles.plus, { color: glass ? c.foreground : c.primaryForeground }]}>
        +
      </Text>
    </Pressable>
  );

  if (glass) {
    return (
      <GlassView isInteractive style={styles.fab}>
        {inner}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.fab,
        styles.solid,
        { backgroundColor: c.primary },
      ]}
    >
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
  },
  solid: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
  },
  press: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { fontFamily: Fonts.regular, fontSize: 34, lineHeight: 38 },
});
