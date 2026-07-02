import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { Button, Card, FieldLabel, InputShell } from '@/components/ui';
import { updateProfile } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Profile page form: edit the display name; the sign-in email is shown
// read-only (it can't be changed here). Extracted from the old settings screen.
export function ProfileForm() {
  const { t } = useTranslation('auth');
  const { user, profile, refreshProfile } = useAuth();
  const [value, setValue] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const c = useTheme();

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { display_name: value });
      await refreshProfile();
      Alert.alert(t('profileDetails.updated'));
    } catch {
      Alert.alert(t('profileDetails.updateError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={styles.card}>
      <FieldLabel>{t('profileFields.displayName')}</FieldLabel>
      <InputShell>
        <TextInput
          style={[styles.input, { color: c.foreground }]}
          value={value}
          onChangeText={setValue}
          autoCapitalize='words'
        />
      </InputShell>

      <FieldLabel>{t('profileDetails.email')}</FieldLabel>
      <InputShell>
        <TextInput
          style={[styles.input, { color: c.mutedForeground }]}
          value={profile?.email ?? ''}
          editable={false}
        />
      </InputShell>

      <Button label={t('profileForm.save')} loading={saving} onPress={save} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
});
