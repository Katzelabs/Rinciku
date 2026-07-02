import { ScreenScroll } from '@/components/ui';
import { LanguagePicker } from '@/features/auth/components/settings/language-picker';
import { Spacing } from '@/constants/theme';

export default function PreferencesSettingsScreen() {
  return (
    <ScreenScroll gap={Spacing.four}>
      <LanguagePicker />
    </ScreenScroll>
  );
}
