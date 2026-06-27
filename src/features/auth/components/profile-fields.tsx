import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { CurrencySelect } from '@/components/shared/currency-select';
import { CurrencyAmountInput } from '@/components/shared/currency-amount-input';
import type { OnboardingInput } from '../schemas';

// Shared profile field components, consumed by both ProfileForm (account
// settings) and the onboarding wizard. Each reads `control` from the
// surrounding FormProvider so the label/hint/validation rendering stays in one
// place.

export function DisplayNameField() {
  const { t } = useTranslation('auth');
  const { control } = useFormContext<OnboardingInput>();
  return (
    <Controller
      control={control}
      name='display_name'
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor='profile-display-name'>
            {t('profileFields.displayName')}
          </FieldLabel>
          <Input
            {...field}
            id='profile-display-name'
            autoComplete='name'
            aria-invalid={fieldState.invalid || undefined}
          />
          <FieldError
            errors={fieldState.error ? [fieldState.error] : undefined}
          />
        </Field>
      )}
    />
  );
}

export function BaseCurrencyField() {
  const { t } = useTranslation('auth');
  const { control } = useFormContext<OnboardingInput>();
  return (
    <Controller
      control={control}
      name='base_currency'
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor='profile-base-currency'>
            {t('profileFields.baseCurrency')}
          </FieldLabel>
          <FieldDescription>
            {t('profileFields.baseCurrencyHint')}
          </FieldDescription>
          <CurrencySelect
            id='profile-base-currency'
            value={field.value}
            onChange={field.onChange}
          />
          <FieldError
            errors={fieldState.error ? [fieldState.error] : undefined}
          />
        </Field>
      )}
    />
  );
}

export function ExpectedIncomeField() {
  const { t } = useTranslation('auth');
  const { control } = useFormContext<OnboardingInput>();
  const baseCurrency = useWatch({ control, name: 'base_currency' });
  return (
    <Controller
      control={control}
      name='expected_monthly_income'
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor='profile-expected-income'>
            {t('profileFields.expectedIncome')}
          </FieldLabel>
          <FieldDescription>
            {t('profileFields.expectedIncomeHint')}
          </FieldDescription>
          <CurrencyAmountInput
            id='profile-expected-income'
            currency={baseCurrency}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            name={field.name}
            invalid={fieldState.invalid}
          />
          <FieldError
            errors={fieldState.error ? [fieldState.error] : undefined}
          />
        </Field>
      )}
    />
  );
}

export function MonthStartDayField() {
  const { t } = useTranslation('auth');
  const { control } = useFormContext<OnboardingInput>();
  return (
    <Controller
      control={control}
      name='month_start_day'
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor='profile-month-start-day'>
            {t('profileFields.cycleStartDay')}
          </FieldLabel>
          <FieldDescription>
            {t('profileFields.cycleStartDayHint')}
          </FieldDescription>
          <Input
            ref={field.ref}
            name={field.name}
            onBlur={field.onBlur}
            value={field.value ?? ''}
            onChange={(event) => {
              const next = event.target.value;
              field.onChange(next === '' ? undefined : Number(next));
            }}
            id='profile-month-start-day'
            type='number'
            inputMode='numeric'
            min='1'
            max='28'
            step='1'
            aria-invalid={fieldState.invalid || undefined}
          />
          <FieldError
            errors={fieldState.error ? [fieldState.error] : undefined}
          />
        </Field>
      )}
    />
  );
}
