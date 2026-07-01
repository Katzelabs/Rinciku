import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { CategoriesManager } from '@/features/categories/components/categories-manager';
import { useTheme } from '@/hooks/use-theme';

// Standalone tiers + categories management screen. The Stack header (More
// layout) supplies the large title; CategoriesManager renders a plain View so
// the scroll container lives here — mirroring settings.tsx.
export default function CategoriesScreen() {
  const c = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <CategoriesManager />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
});
