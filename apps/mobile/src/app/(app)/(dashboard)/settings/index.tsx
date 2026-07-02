import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Lock, SlidersHorizontal, Wallet } from 'lucide-react-native';

import { Card, ScreenScroll } from '@/components/ui';
import { SettingsRow } from '@/components/settings-row';
import { SettingsProfileHeader } from '@/features/auth/components/settings/settings-profile-header';
import { SignOutButton } from '@/features/auth/components/settings/sign-out-button';
import { DangerZoneButton } from '@/features/auth/components/settings/danger-zone-button';
import { Spacing } from '@/constants/theme';

// The settings hub: a profile summary header on top, a card of rows that link
// to dedicated pages (Finances / Preferences / Security), and the account
// actions (sign out, delete account) at the bottom. Mirrors the Manage hub.
export default function SettingsHubScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <ScreenScroll gap={Spacing.four}>
      <SettingsProfileHeader
        onPress={() => router.push('/(app)/(dashboard)/settings/profile')}
      />

      <Card padding={0}>
        <SettingsRow
          icon={Wallet}
          title={t('settings.pages.finances')}
          subtitle={t('settings.rows.finances')}
          onPress={() => router.push('/(app)/(dashboard)/settings/finances')}
        />
        <SettingsRow
          icon={SlidersHorizontal}
          title={t('settings.pages.preferences')}
          subtitle={t('settings.rows.preferences')}
          onPress={() => router.push('/(app)/(dashboard)/settings/preferences')}
          topBorder
        />
        <SettingsRow
          icon={Lock}
          title={t('settings.pages.security')}
          subtitle={t('settings.rows.security')}
          onPress={() => router.push('/(app)/(dashboard)/settings/security')}
          topBorder
        />
      </Card>

      <View style={styles.actions}>
        <SignOutButton />
        <DangerZoneButton />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  actions: { gap: Spacing.two },
});
