import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function MoreLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack screenOptions={{ headerLargeTitle: true }}>
      <Stack.Screen name='index' options={{ title: t('nav.items.more') }} />
      <Stack.Screen name='budgets' options={{ title: t('nav.items.budgets') }} />
      <Stack.Screen
        name='essentials'
        options={{ title: t('nav.items.essentials') }}
      />
      <Stack.Screen
        name='categories'
        options={{ title: t('nav.items.categories') }}
      />
      <Stack.Screen name='fx' options={{ title: t('nav.items.rates') }} />
      <Stack.Screen name='settings' options={{ title: t('settings.title') }} />
    </Stack>
  );
}
