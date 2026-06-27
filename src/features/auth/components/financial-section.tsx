import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { CurrencyAmountInput } from '@/components/shared/currency-amount-input';
import { CurrencySelect } from '@/components/shared/currency-select';
import { CURRENCY_CODES, type CurrencyCode } from '@/lib/fx';
import { useAuth } from '../hooks/use-auth';
import { updateProfile } from '../api';
import { makeOnboardingSchema, type OnboardingInput } from '../schemas';

type FinancialInput = Pick<
  OnboardingInput,
  'base_currency' | 'expected_monthly_income' | 'month_start_day'
>;

function toCurrencyCode(value: string | null | undefined): CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value ?? '')
    ? (value as CurrencyCode)
    : 'IDR';
}

export function FinancialSection() {
  const { t } = useTranslation('auth');
  const { user, profile, refreshProfile } = useAuth();
  const [pending, setPending] = useState<FinancialInput | null>(null);
  const schema = useMemo(
    () =>
      makeOnboardingSchema(t).pick({
        base_currency: true,
        expected_monthly_income: true,
        month_start_day: true,
      }),
    [t]
  );
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<FinancialInput>({
    resolver: zodResolver(schema),
    values: {
      base_currency: toCurrencyCode(profile?.base_currency),
      expected_monthly_income: profile?.expected_monthly_income ?? 0,
      month_start_day: profile?.month_start_day ?? 1,
    },
  });

  const baseCurrency = useWatch({ control, name: 'base_currency' });

  async function persist(values: FinancialInput) {
    if (!user) return;
    try {
      await updateProfile(user.id, values satisfies Partial<OnboardingInput>);
      await refreshProfile();
      reset(values);
      toast.success(t('financial.updated'));
    } catch (error) {
      console.error('Failed to update preferences', error);
      toast.error(t('financial.updateError'));
    }
  }

  async function onSubmit(values: FinancialInput) {
    if (values.base_currency !== profile?.base_currency) {
      setPending(values);
      return;
    }
    await persist(values);
  }

  async function handleConfirm() {
    if (!pending) return;
    const values = pending;
    setPending(null);
    await persist(values);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardHeader>
          <CardTitle>{t('financial.title')}</CardTitle>
          <CardDescription>{t('financial.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={control}
              name='base_currency'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor='settings-base-currency'>
                    {t('profileFields.baseCurrency')}
                  </FieldLabel>
                  <FieldDescription>
                    {t('profileFields.baseCurrencyHint')}
                  </FieldDescription>
                  <CurrencySelect
                    id='settings-base-currency'
                    value={field.value}
                    onChange={field.onChange}
                  />
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
                  <FieldLabel htmlFor='settings-expected-income'>
                    {t('profileFields.expectedIncome')}
                  </FieldLabel>
                  <FieldDescription>
                    {t('profileFields.expectedIncomeHint')}
                  </FieldDescription>
                  <CurrencyAmountInput
                    id='settings-expected-income'
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
            <Controller
              control={control}
              name='month_start_day'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor='settings-month-start-day'>
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
                    id='settings-month-start-day'
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
          </FieldGroup>
        </CardContent>
        <CardFooter className='justify-end border-t'>
          <Button type='submit' disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Spinner data-icon='inline-start' />}
            {isSubmitting ? t('common:actions.saving') : t('common:actions.save')}
          </Button>
        </CardFooter>
      </form>

      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('financial.changeCurrencyTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('financial.changeCurrencyDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {t('common:actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
