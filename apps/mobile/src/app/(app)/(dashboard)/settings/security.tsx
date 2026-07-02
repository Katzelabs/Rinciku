import { ScreenScroll } from '@/components/ui';
import { ChangePasswordForm } from '@/features/auth/components/settings/change-password-form';
import { Spacing } from '@/constants/theme';

export default function SecuritySettingsScreen() {
  return (
    <ScreenScroll gap={Spacing.four}>
      <ChangePasswordForm />
    </ScreenScroll>
  );
}
