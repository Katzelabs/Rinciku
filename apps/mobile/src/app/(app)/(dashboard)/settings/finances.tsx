import { ScreenScroll } from '@/components/ui';
import { FinancesForm } from '@/features/auth/components/settings/finances-form';
import { Spacing } from '@/constants/theme';

export default function FinancesSettingsScreen() {
  return (
    <ScreenScroll gap={Spacing.four}>
      <FinancesForm />
    </ScreenScroll>
  );
}
