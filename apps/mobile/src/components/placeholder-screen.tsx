import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PlaceholderScreenProps {
  title: string;
  subtitle?: string;
}

// Stub body for the Phase-2 shell. Real feature content replaces these in
// Phase 3 (M7–M12); for now each tab/route renders a branded empty state so the
// navigation skeleton and glass chrome can be exercised end to end.
export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  const c = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={styles.content}
    >
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          {subtitle ?? 'Coming soon.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.four },
  card: {
    padding: Spacing.four,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderCurve: 'continuous',
    gap: Spacing.two,
  },
  title: { fontFamily: Fonts.bold, fontSize: 22 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
});
