import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';

// Sign-out action for the settings hub bottom. The root guard routes back to
// (auth) once the session clears. Extracted from the old settings screen.
export function SignOutButton() {
  const { t } = useTranslation('common');
  return (
    <Button
      variant='outline'
      label={t('account.signOut')}
      onPress={() => void supabase.auth.signOut()}
    />
  );
}
