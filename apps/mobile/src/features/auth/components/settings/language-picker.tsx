import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet } from 'react-native';

import { SUPPORTED_LANGUAGES, type Language } from '@rinciku/core/i18n/init';

import { Card, FieldLabel } from '@/components/ui';
import { Segmented } from '@/components/segmented';
import { updateLanguage } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Spacing } from '@/constants/theme';

// Preferences page: language switch (EN/ID). Applies instantly, then persists
// to the profile. Structured as its own component so the Preferences page can
// grow (theme, notifications) later. Extracted from the old settings screen.
export function LanguagePicker() {
  const { t, i18n } = useTranslation('common');
  const { user, refreshProfile } = useAuth();
  const current = (i18n.resolvedLanguage ?? 'en') as Language;

  async function choose(lng: Language) {
    if (lng === current) return;
    await i18n.changeLanguage(lng);
    if (!user) return;
    try {
      await updateLanguage(user.id, lng);
      await refreshProfile();
    } catch {
      Alert.alert(t('appearance.language.saveError'));
    }
  }

  return (
    <Card style={styles.card}>
      <FieldLabel>{t('appearance.language.label')}</FieldLabel>
      <Segmented
        options={SUPPORTED_LANGUAGES.map((lng) => ({
          key: lng,
          label: lng.toUpperCase(),
        }))}
        value={current}
        onChange={(lng) => void choose(lng)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
});
