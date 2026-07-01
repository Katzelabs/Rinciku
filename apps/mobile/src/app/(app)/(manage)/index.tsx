import { useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { HeaderAddButton } from '@/components/header-add-button';
import { Segmented, type SegmentedOption } from '@/components/segmented';
import { Spacing } from '@/constants/theme';
import { BudgetsManager } from '@/features/budgets/components/budgets-manager';
import {
  CategoriesManager,
  type CategoriesManagerHandle,
} from '@/features/categories/components/categories-manager';
import {
  EssentialsManager,
  type EssentialsManagerHandle,
} from '@/features/essentials/components/essentials-manager';
import { useTheme } from '@/hooks/use-theme';

type Segment = 'essentials' | 'budgets' | 'categories';

// The Manage tab merges the three planning surfaces — Essentials, Budgets and
// Categories — behind a pill segmented control. The header "+" acts on the
// active segment's manager (create essential / create tier); Budgets edits
// per-category targets inline, so it has no add action.
export default function ManageScreen() {
  const c = useTheme();
  const { t } = useTranslation('common');
  const { t: tEssentials } = useTranslation('essentials');
  const { t: tCategories } = useTranslation('categories');
  const [active, setActive] = useState<Segment>('essentials');
  const essentialsRef = useRef<EssentialsManagerHandle>(null);
  const categoriesRef = useRef<CategoriesManagerHandle>(null);

  const options: SegmentedOption<Segment>[] = [
    { key: 'essentials', label: t('nav.items.essentials') },
    { key: 'budgets', label: t('nav.items.budgets') },
    { key: 'categories', label: t('nav.items.categories') },
  ];

  const headerRight = () => {
    if (active === 'essentials') {
      return (
        <HeaderAddButton
          accessibilityLabel={tEssentials('page.addButton')}
          onPress={() => essentialsRef.current?.openCreate()}
        />
      );
    }
    if (active === 'categories') {
      return (
        <HeaderAddButton
          accessibilityLabel={tCategories('spending.addTier')}
          onPress={() => categoriesRef.current?.openCreate()}
        />
      );
    }
    return null;
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ headerRight }} />

      <Segmented options={options} value={active} onChange={setActive} />

      {active === 'essentials' ? (
        <EssentialsManager ref={essentialsRef} inlineAdd={false} />
      ) : active === 'budgets' ? (
        <BudgetsManager />
      ) : (
        <CategoriesManager ref={categoriesRef} inlineAdd={false} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
});
