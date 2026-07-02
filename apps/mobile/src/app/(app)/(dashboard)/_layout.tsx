import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name='index' options={{ title: t('nav.items.dashboard') }} />
      {/* settings is a nested Stack (hub + pages); it owns its own headers. */}
      <Stack.Screen name='settings' options={{ headerShown: false }} />
      <Stack.Screen name='fx' options={{ title: t('nav.items.rates') }} />
    </Stack>
  );
}
