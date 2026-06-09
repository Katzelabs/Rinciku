import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCY_CODES, type CurrencyCode } from '@/lib/fx';
import { CURRENCY_NAMES } from '@/lib/currency-meta';
import { onboardingSchema, type OnboardingInput } from '../schemas';
import type { Profile } from '../types';

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
  submitLabel = 'Save',
  submittingLabel = 'Saving…',
}: ProfileFormProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      display_name: initialValues?.display_name ?? '',
      base_currency: toCurrencyCode(initialValues?.base_currency),
      expected_monthly_income: initialValues?.expected_monthly_income ?? 0,
      month_start_day: initialValues?.month_start_day ?? 1,
    },
  });

  const baseCurrency = useWatch({ control, name: 'base_currency' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          control={control}
          name='display_name'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='profile-display-name'>
                Display name
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
        <Controller
          control={control}
          name='base_currency'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='profile-base-currency'>
                Base currency
              </FieldLabel>
              <FieldDescription>
                Used to display dashboard totals.
              </FieldDescription>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id='profile-base-currency'
                  className='w-full'
                  aria-invalid={fieldState.invalid || undefined}
                >
                  <SelectValue placeholder='Select currency' />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code} — {CURRENCY_NAMES[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                errors={fieldState.error ? [fieldState.error] : undefined}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name='expected_monthly_income'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='profile-expected-income'>
                Expected monthly income
              </FieldLabel>
              <FieldDescription>
                Use 0 if your income varies a lot — the dashboard will hide the
                expected baseline.
              </FieldDescription>
              <InputGroup>
                <InputGroupAddon>
                  <span className='text-sm font-medium text-muted-foreground'>
                    {baseCurrency}
                  </span>
                </InputGroupAddon>
                <InputGroupInput
                  ref={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  value={field.value ?? ''}
                  onChange={(event) => {
                    const next = event.target.value;
                    field.onChange(next === '' ? undefined : Number(next));
                  }}
                  id='profile-expected-income'
                  type='number'
                  inputMode='decimal'
                  step='0.01'
                  min='0'
                  aria-invalid={fieldState.invalid || undefined}
                />
              </InputGroup>
              <FieldError
                errors={fieldState.error ? [fieldState.error] : undefined}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name='month_start_day'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='profile-month-start-day'>
                Budget cycle start day
              </FieldLabel>
              <FieldDescription>
                Day of the month your budget resets (1–28).
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
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
