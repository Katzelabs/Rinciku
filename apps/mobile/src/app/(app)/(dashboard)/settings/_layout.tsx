import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

// The settings area is a hub (index) that links to dedicated pages — the same
// pattern as the Manage group. This nested Stack owns the headers; the parent
// dashboard stack hides its header for the `settings` route to avoid doubling.
export default function SettingsLayout() {
  const { t } = useTranslation('common');
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name='index' options={{ title: t('settings.title') }} />
      <Stack.Screen
        name='profile'
        options={{ title: t('settings.pages.profile') }}
      />
      <Stack.Screen
        name='finances'
        options={{ title: t('settings.pages.finances') }}
      />
      <Stack.Screen
        name='preferences'
        options={{ title: t('settings.pages.preferences') }}
      />
      <Stack.Screen
        name='security'
        options={{ title: t('settings.pages.security') }}
      />
    </Stack>
  );
}
