import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export function AuthLoading() {
  const { t } = useTranslation('auth');
  return (
    <div className='flex h-screen items-center justify-center'>
      <Loader2 className='size-6 animate-spin text-muted-foreground' />
      <span className='sr-only'>{t('loading')}</span>
    </div>
  );
}
