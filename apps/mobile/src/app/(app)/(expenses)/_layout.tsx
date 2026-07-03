import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { resetStackOnTabBlur } from '@/lib/navigation';

export default function ExpensesLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack
      screenListeners={resetStackOnTabBlur}
      screenOptions={{
        headerLargeTitle: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name='index'
        options={{ headerTitle: t('expenses:page.title') }}
      />
      <Stack.Screen name='list' options={{ title: t('expenses:list.title') }} />
      <Stack.Screen
        name='new'
        options={{
          presentation: 'modal',
          headerLargeTitle: false,
          title: t('expenses:page.addExpense'),
        }}
      />
      <Stack.Screen
        name='[id]'
        options={{ headerLargeTitle: false, title: t('expenses:detail.title') }}
      />
    </Stack>
  );
}
