import { useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { CURRENCY_CODES, type CurrencyCode } from '@/lib/fx';
import { makeOnboardingSchema, type OnboardingInput } from '../schemas';
import type { Profile } from '../types';
import {
  BaseCurrencyField,
  DisplayNameField,
  ExpectedIncomeField,
  MonthStartDayField,
} from './profile-fields';

interface ProfileFormProps {
  initialValues?: Profile | null;
  onSubmit: (values: OnboardingInput) => Promise<void> | void;
  submitLabel?: string;
  submittingLabel?: string;
}

function toCurrencyCode(value: string | null | undefined): CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value ?? '')
    ? (value as CurrencyCode)
    : 'IDR';
}

export function ProfileForm({
  initialValues,
  onSubmit,
  submitLabel,
  submittingLabel,
}: ProfileFormProps) {
  const { t } = useTranslation('auth');
  const schema = useMemo(() => makeOnboardingSchema(t), [t]);
  const methods = useForm<OnboardingInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: initialValues?.display_name ?? '',
      base_currency: toCurrencyCode(initialValues?.base_currency),
      expected_monthly_income: initialValues?.expected_monthly_income ?? 0,
      month_start_day: initialValues?.month_start_day ?? 1,
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <DisplayNameField />
          <BaseCurrencyField />
          <ExpectedIncomeField />
          <MonthStartDayField />
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting
              ? (submittingLabel ?? t('profileForm.saving'))
              : (submitLabel ?? t('profileForm.save'))}
          </Button>
        </FieldGroup>
      </form>
    </FormProvider>
  );
}
