import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack screenOptions={{ headerLargeTitle: true }}>
      <Stack.Screen name='index' options={{ title: t('nav.items.dashboard') }} />
      <Stack.Screen name='settings' options={{ title: t('settings.title') }} />
      <Stack.Screen name='fx' options={{ title: t('nav.items.rates') }} />
    </Stack>
  );
}
