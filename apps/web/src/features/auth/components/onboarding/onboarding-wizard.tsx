import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { LanguageSelect } from '@/components/shared/language-select';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CURRENCY_CODES, type CurrencyCode } from '@rinciku/core';

import { upsertProfile } from '../../api';
import { useAuth } from '../../hooks/use-auth';
import { makeOnboardingSchema, type OnboardingInput } from '../../schemas';
import { AccountStep } from './steps/account-step';
import { BudgetStep } from './steps/budget-step';
import { CategoriesReviewStep } from './steps/categories-review-step';
import { CurrencyStep } from './steps/currency-step';
import { WizardProgress } from './wizard-progress';

type StepKey = 'account' | 'currency' | 'budget' | 'review';

type Step = {
  key: StepKey;
  fields: (keyof OnboardingInput)[];
  Component: () => React.ReactNode;
};

const STEPS: Step[] = [
  { key: 'account', fields: ['display_name'], Component: AccountStep },
  { key: 'currency', fields: ['base_currency'], Component: CurrencyStep },
  {
    key: 'budget',
    fields: ['expected_monthly_income', 'month_start_day'],
    Component: BudgetStep,
  },
  { key: 'review', fields: [], Component: CategoriesReviewStep },
];

function toCurrencyCode(value: string | null | undefined): CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value ?? '')
    ? (value as CurrencyCode)
    : 'IDR';
}

export function OnboardingWizard() {
  const { t } = useTranslation('auth');
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const schema = useMemo(() => makeOnboardingSchema(t), [t]);
  const methods = useForm<OnboardingInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: profile?.display_name ?? '',
      base_currency: toCurrencyCode(profile?.base_currency),
      expected_monthly_income: profile?.expected_monthly_income ?? 0,
      // Start blank (not a pre-filled 1) so the user types their own day; the
      // schema requires an integer 1–28, so empty/0 fail validation on submit.
      month_start_day: profile?.month_start_day ?? undefined,
    },
  });
  const {
    formState: { isSubmitting },
  } = methods;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  async function handleNext() {
    const valid = await methods.trigger(current.fields);
    if (valid) setStep((s) => s + 1);
  }

  async function onFinish(values: OnboardingInput) {
    if (!user) return;
    try {
      await upsertProfile(user.id, values);
      await refreshProfile();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to save profile', error);
      toast.error(t('onboarding.saveError'));
    }
  }

  const StepComponent = current.Component;

  return (
    <div
      className={cn(
        'w-full transition-[max-width]',
        isLast ? 'max-w-2xl' : 'max-w-md'
      )}
    >
      <div className='mb-2 flex justify-end'>
        <LanguageSelect />
      </div>
      <Card className='w-full'>
        <CardHeader>
          <WizardProgress step={step} total={STEPS.length} />
          <CardTitle className='mt-4'>
            {t(`onboarding.steps.${current.key}.title`)}
          </CardTitle>
          <CardDescription>
            {t(`onboarding.steps.${current.key}.description`)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              <StepComponent />
            </form>
          </FormProvider>
        </CardContent>
        <CardFooter className='justify-between gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setStep((s) => s - 1)}
            disabled={isFirst || isSubmitting}
          >
            {t('onboarding.nav.back')}
          </Button>
          {isLast ? (
            <Button
              type='button'
              onClick={methods.handleSubmit(onFinish)}
              disabled={isSubmitting}
            >
              {t('onboarding.nav.finish')}
            </Button>
          ) : (
            <Button type='button' onClick={handleNext}>
              {t('onboarding.nav.next')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
