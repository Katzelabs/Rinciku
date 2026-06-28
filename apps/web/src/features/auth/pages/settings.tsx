import { useTranslation } from 'react-i18next';
import { AppearanceSection } from '../components/appearance-section';
import { ChangePasswordSection } from '../components/change-password-section';
import { DangerZoneSection } from '../components/danger-zone-section';
import { FinancialSection } from '../components/financial-section';
import { ProfileDetailsSection } from '../components/profile-details-section';

export function SettingsPage() {
  const { t } = useTranslation('common');
  return (
    <div className='w-full space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>{t('settings.title')}</h1>
        <p className='text-sm text-muted-foreground'>
          {t('settings.subtitle')}
        </p>
      </div>

      <div className='grid grid-cols-1 items-start gap-6 md:grid-cols-2'>
        <ProfileDetailsSection />
        <AppearanceSection />
        <FinancialSection />
        <ChangePasswordSection />
      </div>

      <DangerZoneSection />
    </div>
  );
}
