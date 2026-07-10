import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { resetStackOnTabBlur } from '@/lib/navigation';

export default function DashboardLayout() {
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
        options={{ title: t('nav.items.dashboard') }}
      />
      {/* Settings hub + pages live directly in this stack (not a nested one) so
          each is a pushed screen with a real native back button — same as the
          expense detail screen. The hub is reached from the avatar on the left
          of the header, so it slides in from the left instead of the default
          right; the deeper pages keep the default right-to-left push. */}
      <Stack.Screen
        name='settings/index'
        options={{ title: t('settings.title'), animation: 'slide_from_left' }}
      />
      <Stack.Screen
        name='settings/profile'
        options={{ title: t('settings.pages.profile') }}
      />
      <Stack.Screen
        name='settings/finances'
        options={{ title: t('settings.pages.finances') }}
      />
      <Stack.Screen
        name='settings/preferences'
        options={{ title: t('settings.pages.preferences') }}
      />
      <Stack.Screen
        name='settings/security'
        options={{ title: t('settings.pages.security') }}
      />
      <Stack.Screen name='fx' options={{ title: t('nav.items.rates') }} />
    </Stack>
  );
}
