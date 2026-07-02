import { ScreenScroll } from '@/components/ui';
import { ProfileForm } from '@/features/auth/components/settings/profile-form';
import { Spacing } from '@/constants/theme';

export default function ProfileSettingsScreen() {
  return (
    <ScreenScroll gap={Spacing.four}>
      <ProfileForm />
    </ScreenScroll>
  );
}
