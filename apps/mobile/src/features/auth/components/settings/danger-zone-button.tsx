import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Button } from '@/components/ui';
import { deleteAccount } from '@/features/auth/api';

// Delete-account action for the settings hub bottom. Confirms first, then
// deleteAccount() invokes the Edge Function and signs out on success; the root
// guard routes back to (auth). Extracted from the old settings screen.
export function DangerZoneButton() {
  const { t } = useTranslation('auth');
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    Alert.alert(t('dangerZone.dialogTitle'), t('dangerZone.description'), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('dangerZone.button'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteAccount();
          } catch {
            setDeleting(false);
            Alert.alert(
              t('dangerZone.deleteError', { detail: t('dangerZone.tryAgain') })
            );
          }
        },
      },
    ]);
  }

  return (
    <Button
      variant='destructive'
      label={deleting ? t('dangerZone.deleting') : t('dangerZone.button')}
      loading={deleting}
      onPress={confirmDelete}
    />
  );
}
