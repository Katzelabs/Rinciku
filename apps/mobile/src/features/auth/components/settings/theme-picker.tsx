import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { Card, FieldLabel } from '@/components/ui';
import { Segmented } from '@/components/segmented';
import { useThemePreference } from '@/lib/theme-preference';
import type { ThemePreference } from '@/lib/theme-preference';
import { Spacing } from '@/constants/theme';

// Preferences page: theme switch (light / dark / system). Applies instantly and
// persists to AsyncStorage via the theme context — no DB round-trip (theme is a
// per-device choice, mirroring the web app). Sits next to LanguagePicker.
const OPTIONS: ThemePreference[] = ['light', 'dark', 'system'];

export function ThemePicker() {
  const { t } = useTranslation('common');
  const { preference, setPreference } = useThemePreference();

  return (
    <Card style={styles.card}>
      <FieldLabel>{t('appearance.theme.label')}</FieldLabel>
      <Segmented
        options={OPTIONS.map((key) => ({
          key,
          label: t(`appearance.theme.${key}`),
        }))}
        value={preference}
        onChange={setPreference}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
});
