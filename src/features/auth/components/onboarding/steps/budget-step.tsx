import { FieldGroup } from '@/components/ui/field';
import { ExpectedIncomeField, MonthStartDayField } from '../../profile-fields';

export function BudgetStep() {
  return (
    <FieldGroup>
      <ExpectedIncomeField />
      <MonthStartDayField />
    </FieldGroup>
  );
}
