import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { EssentialsManager } from '@/features/essentials/components/essentials-manager';
import { useTheme } from '@/hooks/use-theme';

// Standalone essentials management screen. The Stack header (More layout)
// supplies the large title; EssentialsManager renders a plain View so the
// scroll container lives here — mirroring categories.tsx.
export default function EssentialsScreen() {
  const c = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <EssentialsManager />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
});
