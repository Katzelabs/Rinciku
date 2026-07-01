import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CURRENCY_CODES,
  CURRENCY_NAMES,
  currencySymbol,
  type CurrencyCode,
} from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { Icon } from '@/components/icon';
import { CategoriesManager } from '@/features/categories/components/categories-manager';
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

// Step indicator: a row of segments that fill with the brand color as the user
// advances. The textual "step X of Y" stays as the accessibility label.
function WizardProgress({ step, total }: { step: number; total: number }) {
  const c = useTheme();
  const { t } = useTranslation('auth');
  return (
    <View
      style={styles.progressWrap}
      accessibilityRole='progressbar'
      accessibilityLabel={t('onboarding.progress', {
        current: step + 1,
        total,
      })}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSeg,
            { backgroundColor: i <= step ? c.primary : c.muted },
          ]}
        />
      ))}
    </View>
  );
}

export function OnboardingWizard() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const { user, profile, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const schema = useMemo(() => makeOnboardingSchema(t), [t]);
  const methods = useForm<OnboardingInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: profile?.display_name ?? '',
      base_currency: toCurrencyCode(profile?.base_currency),
      expected_monthly_income: profile?.expected_monthly_income ?? 0,
      // Start blank (not a pre-filled 1) so the user types their own day; the
      // schema requires an integer 1–28, so empty/0 fail validation on Next.
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
      keyboardShouldPersistTaps='handled'
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + Spacing.six,
        },
      ]}
    >
      <WizardProgress step={step} total={STEPS.length} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>
          {t(`onboarding.steps.${current.key}.title`)}
        </Text>
        <Text style={[styles.description, { color: c.mutedForeground }]}>
          {t(`onboarding.steps.${current.key}.description`)}
        </Text>
      </View>

      <FormProvider {...methods}>
        <View style={styles.stepBody}>
          {current.key === 'account' ? <AccountStep /> : null}
          {current.key === 'currency' ? <CurrencyStep /> : null}
          {current.key === 'budget' ? <BudgetStep /> : null}
          {current.key === 'review' ? <CategoriesManager /> : null}
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
                  <View
                    style={[
                      styles.currencyAccent,
                      { backgroundColor: selected ? c.primary : 'transparent' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.currencySymbol,
                      { color: c.mutedForeground },
                    ]}
                  >
                    {currencySymbol(code)}
                  </Text>
                  <Text style={[styles.currencyName, { color: c.foreground }]}>
                    {code} · {CURRENCY_NAMES[code]}
                  </Text>
                  {selected ? (
                    <Icon
                      name='checkmark.circle.fill'
                      size={20}
                      color={c.primary}
                    />
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
  placeholder,
}: {
  name: 'expected_monthly_income' | 'month_start_day';
  label: string;
  hint?: string;
  placeholder?: string;
}) {
  const c = useTheme();
  const { control } = useFormContext<OnboardingInput>();
  const [focused, setFocused] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={styles.fieldGap}>
          <FieldLabel>{label}</FieldLabel>
          <InputShell invalid={!!fieldState.error} focused={focused}>
            <NumberInput
              value={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                field.onBlur();
              }}
            />
          </InputShell>
          {hint ? (
            <Text style={[styles.hint, { color: c.mutedForeground }]}>
              {hint}
            </Text>
          ) : null}
          <FieldError message={fieldState.error?.message} />
        </View>
      )}
    />
  );
}

// Integer input that maps the empty string to `undefined` so the Zod
// "enter a number" message fires, and otherwise parses to a Number. It keeps its
// own text state (rather than deriving the display straight from the numeric
// value) so clearing the field to empty sticks — a value-derived controlled
// input can snap a just-cleared "0"/"1" back on the next render.
function NumberInput({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder?: string;
}) {
  const c = useTheme();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value == null ? '' : String(value));

  // While the user isn't editing, mirror the external value (form reset/default,
  // a returning user's saved day). Guarded render-time sync — React's
  // recommended alternative to a syncing effect — so it never clobbers what the
  // user is typing, including an intentionally empty field.
  if (!editing) {
    const wanted = value == null ? '' : String(value);
    if (wanted !== text) setText(wanted);
  }

  return (
    <TextInput
      style={[styles.numberInput, { color: c.foreground }]}
      placeholder={placeholder}
      placeholderTextColor={c.mutedForeground}
      keyboardType='number-pad'
      // Select the current value on focus so the first keystroke replaces an
      // existing value (e.g. a returning user's saved day) instead of appending
      // to it — otherwise "1" + typing "5" reads as "15".
      selectTextOnFocus
      value={text}
      onFocus={() => {
        setEditing(true);
        onFocus();
      }}
      onBlur={() => {
        setEditing(false);
        onBlur();
      }}
      onChangeText={(input: string) => {
        const cleaned = input.replace(/[^0-9]/g, '');
        setText(cleaned);
        onChange(cleaned === '' ? undefined : Number(cleaned));
      }}
    />
  );
}

function BudgetStep() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const { control } = useFormContext<OnboardingInput>();
  const baseCurrency = useWatch({ control, name: 'base_currency' });
  return (
    <View style={styles.fieldGap}>
      <Controller
        control={control}
        name='expected_monthly_income'
        render={({ field, fieldState }) => (
          <View style={styles.fieldGap}>
            <FieldLabel>{t('profileFields.expectedIncome')}</FieldLabel>
            <CurrencyAmountInput
              currency={baseCurrency}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={!!fieldState.error}
            />
            <Text style={[styles.hint, { color: c.mutedForeground }]}>
              {t('profileFields.expectedIncomeHint')}
            </Text>
            <FieldError message={fieldState.error?.message} />
          </View>
        )}
      />
      <NumberField
        name='month_start_day'
        label={t('profileFields.cycleStartDay')}
        hint={t('profileFields.cycleStartDayHint')}
        placeholder='1–28'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  progressWrap: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  progressSeg: {
    flex: 1,
    height: 5,
    borderRadius: Radius.pill,
  },
  header: { gap: Spacing.two, alignItems: 'center' },
  title: { fontFamily: Fonts.bold, fontSize: 26, textAlign: 'center' },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
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
    borderRadius: Radius['2xl'],
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
  currencyAccent: {
    position: 'absolute',
    left: 0,
    top: Spacing.two,
    bottom: Spacing.two,
    width: 3,
    borderTopRightRadius: Radius.pill,
    borderBottomRightRadius: Radius.pill,
  },
  currencySymbol: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    minWidth: 34,
  },
  currencyName: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
});
