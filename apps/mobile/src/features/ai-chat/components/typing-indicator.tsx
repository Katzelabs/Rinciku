import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Shown while a turn is in flight (one or more model round-trips + auto-executed
// read tools). Mirrors the web TypingIndicator.
export function TypingIndicator() {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  return (
    <View style={styles.row}>
      <ActivityIndicator size='small' color={c.mutedForeground} />
      <AppText variant='caption' color='mutedForeground'>
        {t('message.thinking')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
