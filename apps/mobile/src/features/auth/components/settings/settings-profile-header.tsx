import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { AppText, Card } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  onPress: () => void;
}

// The settings hub's top row: a larger avatar + display name + email that taps
// through to the Profile page. Reuses ProfileAvatar (single source of truth for
// initials + person fallback) at a larger size.
export function SettingsProfileHeader({ onPress }: Props) {
  const c = useTheme();
  const { t } = useTranslation('common');
  const { profile } = useAuth();
  const name = profile?.display_name?.trim() || profile?.email || '';
  const email = profile?.email ?? '';

  return (
    <Pressable
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      <Card style={styles.row}>
        <ProfileAvatar
          onPress={onPress}
          accessibilityLabel={t('settings.pages.profile')}
          size={48}
        />
        <View style={styles.text}>
          <AppText variant='heading' numberOfLines={1}>
            {name}
          </AppText>
          {email ? (
            <AppText variant='caption' color='mutedForeground' numberOfLines={1}>
              {email}
            </AppText>
          ) : null}
        </View>
        <ChevronRight size={18} color={c.mutedForeground} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  text: { flex: 1, gap: 2 },
});
