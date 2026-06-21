import { AppearanceSection } from '../components/appearance-section';
import { ChangePasswordSection } from '../components/change-password-section';
import { DangerZoneSection } from '../components/danger-zone-section';
import { FinancialSection } from '../components/financial-section';
import { ProfileDetailsSection } from '../components/profile-details-section';

export function SettingsPage() {
  return (
    <div className='w-full space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Settings</h1>
        <p className='text-sm text-muted-foreground'>
          Manage your profile, preferences, and account.
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
