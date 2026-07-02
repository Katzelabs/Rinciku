import { ScreenScroll } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { BudgetsManager } from '@/features/budgets/components/budgets-manager';

// Budgets edits per-category targets inline (tap a row → target modal), so this
// screen has no header add action.
export default function BudgetsScreen() {
  return (
    <ScreenScroll gap={Spacing.four}>
      <BudgetsManager />
    </ScreenScroll>
  );
}
