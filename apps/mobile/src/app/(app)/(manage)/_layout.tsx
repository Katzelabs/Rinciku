import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { resetStackOnTabBlur } from '@/lib/navigation';

export default function ManageLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack
      screenListeners={resetStackOnTabBlur}
      screenOptions={{
        headerLargeTitle: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name='index' options={{ title: t('nav.items.manage') }} />
      <Stack.Screen
        name='essentials'
        options={{ title: t('nav.items.essentials') }}
      />
      <Stack.Screen
        name='budgets'
        options={{ title: t('nav.items.budgets') }}
      />
      <Stack.Screen
        name='categories'
        options={{ title: t('nav.items.categories') }}
      />
      <Stack.Screen
        name='income-categories'
        options={{ title: t('incomes:categories.title') }}
      />
    </Stack>
  );
}
