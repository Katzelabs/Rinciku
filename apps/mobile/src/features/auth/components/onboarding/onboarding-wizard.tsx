import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  CURRENCY_CODES,
  CURRENCY_NAMES,
  currencyFlag,
  type CurrencyCode,
} from '@rinciku/core';
import { createCategoriesApi } from '@rinciku/domain/categories';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { upsertProfile } from '@/features/auth/api';
import { Button } from '@/features/auth/components/button';
import {
  FieldError,
  FieldLabel,
  InputShell,
  TextField,
} from '@/features/auth/components/text-field';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  makeOnboardingSchema,
  type OnboardingInput,
} from '@/features/auth/schemas';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type StepKey = 'account' | 'currency' | 'budget' | 'review';

const STEPS: { key: StepKey; fields: (keyof OnboardingInput)[] }[] = [
  { key: 'account', fields: ['display_name'] },
  { key: 'currency', fields: ['base_currency'] },
  { key: 'budget', fields: ['expected_monthly_income', 'month_start_day'] },
  { key: 'review', fields: [] },
];

function toCurrencyCode(value: string | null | undefined): CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value ?? '')
    ? (value as CurrencyCode)
    : 'IDR';
}

export function OnboardingWizard() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);

  const schema = useMemo(() => makeOnboardingSchema(t), [t]);
  const methods = useForm<OnboardingInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: profile?.display_name ?? '',
      base_currency: toCurrencyCode(profile?.base_currency),
      expected_monthly_income: profile?.expected_monthly_income ?? 0,
      month_start_day: profile?.month_start_day ?? 1,
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

  const onFinish = methods.handleSubmit(async (values) => {
    if (!user) return;
    try {
      await upsertProfile(user.id, values);
      await refreshProfile();
      // The root guard flips to the (app) group once onboarded_at is set.
    } catch (error) {
      console.error('Failed to save profile', error);
      Alert.alert(t('onboarding.saveError'));
    }
  });

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.progress, { color: c.mutedForeground }]}>
        {t('onboarding.progress', { current: step + 1, total: STEPS.length })}
      </Text>
      <Text style={[styles.title, { color: c.foreground }]}>
        {t(`onboarding.steps.${current.key}.title`)}
      </Text>
      <Text style={[styles.description, { color: c.mutedForeground }]}>
        {t(`onboarding.steps.${current.key}.description`)}
      </Text>

      <FormProvider {...methods}>
        <View style={styles.stepBody}>
          {current.key === 'account' ? <AccountStep /> : null}
          {current.key === 'currency' ? <CurrencyStep /> : null}
          {current.key === 'budget' ? <BudgetStep /> : null}
          {current.key === 'review' ? <CategoriesReviewStep /> : null}
        </View>
      </FormProvider>

      <View style={styles.nav}>
        <Button
          variant='outline'
          label={t('onboarding.nav.back')}
          disabled={isFirst || isSubmitting}
          onPress={() => setStep((s) => s - 1)}
          style={styles.navButton}
        />
        {isLast ? (
          <Button
            label={t('onboarding.nav.finish')}
            loading={isSubmitting}
            onPress={onFinish}
            style={styles.navButton}
          />
        ) : (
          <Button
            label={t('onboarding.nav.next')}
            onPress={handleNext}
            style={styles.navButton}
          />
        )}
      </View>
    </ScrollView>
  );
}

function AccountStep() {
  const { t } = useTranslation('auth');
  const { control } = useFormContext<OnboardingInput>();
  return (
    <TextField
      control={control}
      name='display_name'
      label={t('profileFields.displayName')}
      autoCapitalize='words'
      autoComplete='name'
    />
  );
}

function CurrencyStep() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const { control } = useFormContext<OnboardingInput>();
  return (
    <Controller
      control={control}
      name='base_currency'
      render={({ field, fieldState }) => (
        <View style={styles.fieldGap}>
          <FieldLabel>{t('profileFields.baseCurrency')}</FieldLabel>
          <View style={[styles.currencyList, { borderColor: c.border }]}>
            {CURRENCY_CODES.map((code, i) => {
              const selected = field.value === code;
              return (
                <Pressable
                  key={code}
                  onPress={() => field.onChange(code)}
                  style={[
                    styles.currencyRow,
                    i > 0 && {
                      borderTopColor: c.border,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                    selected && { backgroundColor: c.muted },
                  ]}
                >
                  <Text style={styles.currencyFlag}>{currencyFlag(code)}</Text>
                  <Text style={[styles.currencyName, { color: c.foreground }]}>
                    {code} · {CURRENCY_NAMES[code]}
                  </Text>
                  {selected ? (
                    <Text style={[styles.check, { color: c.primary }]}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <FieldError message={fieldState.error?.message} />
        </View>
      )}
    />
  );
}

function NumberField({
  name,
  label,
  hint,
}: {
  name: 'expected_monthly_income' | 'month_start_day';
  label: string;
  hint?: string;
}) {
  const c = useTheme();
  const { control } = useFormContext<OnboardingInput>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={styles.fieldGap}>
          <FieldLabel>{label}</FieldLabel>
          <InputShell invalid={!!fieldState.error}>
            <NumberInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </InputShell>
          {hint ? (
            <Text style={[styles.hint, { color: c.mutedForeground }]}>{hint}</Text>
          ) : null}
          <FieldError message={fieldState.error?.message} />
        </View>
      )}
    />
  );
}

// Numeric input that maps the empty string to `undefined` so the Zod
// "enter a number" message fires, and otherwise parses to a Number.
function NumberInput({
  value,
  onChange,
  onBlur,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  onBlur: () => void;
}) {
  const c = useTheme();
  return (
    <TextInput
      style={[styles.numberInput, { color: c.foreground }]}
      placeholderTextColor={c.mutedForeground}
      keyboardType='numeric'
      value={value == null ? '' : String(value)}
      onBlur={onBlur}
      onChangeText={(text: string) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        onChange(cleaned === '' ? undefined : Number(cleaned));
      }}
    />
  );
}

function BudgetStep() {
  const { t } = useTranslation('auth');
  return (
    <View style={styles.fieldGap}>
      <NumberField
        name='expected_monthly_income'
        label={t('profileFields.expectedIncome')}
        hint={t('profileFields.expectedIncomeHint')}
      />
      <NumberField
        name='month_start_day'
        label={t('profileFields.cycleStartDay')}
        hint={t('profileFields.cycleStartDayHint')}
      />
    </View>
  );
}

// Read-only review of the categories seeded by the signup DB trigger. Full
// category CRUD lands in the categories feature phase.
function CategoriesReviewStep() {
  const c = useTheme();
  const [names, setNames] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    const api = createCategoriesApi(supabase);
    api.listCategories().then(({ data }) => {
      if (active) setNames((data ?? []).map((row) => row.name));
    });
    return () => {
      active = false;
    };
  }, []);

  if (!names || names.length === 0) return null;

  return (
    <View style={[styles.reviewBox, { backgroundColor: c.card, borderColor: c.border }]}>
      {names.map((name, i) => (
        <Text
          key={`${name}-${i}`}
          style={[styles.reviewItem, { color: c.foreground }]}
        >
          {name}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  progress: { fontFamily: Fonts.medium, fontSize: 13 },
  title: { fontFamily: Fonts.bold, fontSize: 26 },
  description: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
  stepBody: { marginTop: Spacing.two },
  fieldGap: { gap: Spacing.two },
  nav: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.three },
  navButton: { flex: 1 },
  numberInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
  hint: { fontFamily: Fonts.regular, fontSize: 13 },
  currencyList: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  currencyFlag: { fontSize: 20 },
  currencyName: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
  check: { fontFamily: Fonts.semibold, fontSize: 16 },
  reviewBox: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  reviewItem: { fontFamily: Fonts.regular, fontSize: 15 },
});
