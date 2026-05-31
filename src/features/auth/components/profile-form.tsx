import { Controller, useForm } from 'react-hook-form';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { onboardingSchema, type OnboardingInput } from '../schemas';
import type { Profile } from '../types';

interface ProfileFormProps {
  initialValues?: Profile | null;
  onSubmit: (values: OnboardingInput) => Promise<void> | void;
  submitLabel?: string;
  submittingLabel?: string;
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
      base_currency: initialValues?.base_currency === 'USD' ? 'USD' : 'IDR',
      monthly_income_idr: initialValues?.monthly_income_idr ?? 0,
      monthly_income_usd: initialValues?.monthly_income_usd ?? 0,
      month_start_day: initialValues?.month_start_day ?? 1,
    },
  });

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
                  <SelectItem value='IDR'>IDR — Rupiah</SelectItem>
                  <SelectItem value='USD'>USD — US Dollar</SelectItem>
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
          name='monthly_income_idr'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='profile-income-idr'>
                Monthly income (IDR)
              </FieldLabel>
              <Input
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                value={field.value ?? ''}
                onChange={(event) => {
                  const next = event.target.value;
                  field.onChange(next === '' ? undefined : Number(next));
                }}
                id='profile-income-idr'
                type='number'
                inputMode='decimal'
                step='0.01'
                min='0'
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
          name='monthly_income_usd'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor='profile-income-usd'>
                Monthly income (USD)
              </FieldLabel>
              <Input
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                value={field.value ?? ''}
                onChange={(event) => {
                  const next = event.target.value;
                  field.onChange(next === '' ? undefined : Number(next));
                }}
                id='profile-income-usd'
                type='number'
                inputMode='decimal'
                step='0.01'
                min='0'
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
