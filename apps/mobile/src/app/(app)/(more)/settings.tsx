import { type ReactNode, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { SUPPORTED_LANGUAGES, type Language } from '@rinciku/core/i18n/init';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import {
  deleteAccount,
  updateLanguage,
  updatePassword,
  updateProfile,
} from '@/features/auth/api';
import { Button } from '@/features/auth/components/button';
import { PasswordField } from '@/features/auth/components/password-field';
import { PasswordRules } from '@/features/auth/components/password-rules';
import {
  FieldError,
  FieldLabel,
  InputShell,
} from '@/features/auth/components/text-field';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  makeChangePasswordSchema,
  type ChangePasswordInput,
} from '@/features/auth/schemas';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const c = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentInsetAdjustmentBehavior='automatic'
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.content}
    >
      <ProfileSection />
      <AppearanceSection />
      <FinancialSection />
      <ChangePasswordSection />
      <DangerZoneSection />
      <SignOutButton />
    </ScrollView>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const c = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>{title}</Text>
        {description ? (
          <Text style={[styles.sectionDesc, { color: c.mutedForeground }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {children}
      </View>
    </View>
  );
}

function ProfileSection() {
  const { t } = useTranslation('auth');
  const { user, profile, refreshProfile } = useAuth();
  const [value, setValue] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const c = useTheme();

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { display_name: value });
      await refreshProfile();
      Alert.alert(t('profileDetails.updated'));
    } catch {
      Alert.alert(t('profileDetails.updateError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title={t('profileDetails.title')} description={t('profileDetails.description')}>
      <FieldLabel>{t('profileFields.displayName')}</FieldLabel>
      <InputShell>
        <TextInput
          style={[styles.input, { color: c.foreground }]}
          value={value}
          onChangeText={setValue}
          autoCapitalize='words'
        />
      </InputShell>
      <Button label={t('profileForm.save')} loading={saving} onPress={save} />
    </Section>
  );
}

function AppearanceSection() {
  const c = useTheme();
  const { t, i18n } = useTranslation('common');
  const { user, refreshProfile } = useAuth();
  const current = (i18n.resolvedLanguage ?? 'en') as string;

  async function choose(lng: Language) {
    if (lng === current) return;
    await i18n.changeLanguage(lng);
    if (!user) return;
    try {
      await updateLanguage(user.id, lng);
      await refreshProfile();
    } catch {
      Alert.alert(t('appearance.language.saveError'));
    }
  }

  return (
    <Section title={t('appearance.title')} description={t('appearance.description')}>
      <FieldLabel>{t('appearance.language.label')}</FieldLabel>
      <View style={styles.segment}>
        {SUPPORTED_LANGUAGES.map((lng) => {
          const selected = lng === current;
          return (
            <Pressable
              key={lng}
              onPress={() => void choose(lng)}
              style={[
                styles.segmentItem,
                { borderColor: c.border },
                selected && { backgroundColor: c.primary },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: selected ? c.primaryForeground : c.foreground },
                ]}
              >
                {lng.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

function FinancialSection() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const { user, profile, refreshProfile } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>(
    (CURRENCY_CODES as readonly string[]).includes(profile?.base_currency ?? '')
      ? (profile!.base_currency as CurrencyCode)
      : 'IDR'
  );
  const [income, setIncome] = useState(
    profile?.expected_monthly_income != null
      ? String(profile.expected_monthly_income)
      : ''
  );
  const [day, setDay] = useState(
    profile?.month_start_day != null ? String(profile.month_start_day) : '1'
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        base_currency: currency,
        expected_monthly_income: Number(income || 0),
        month_start_day: Number(day || 1),
      });
      await refreshProfile();
      Alert.alert(t('financial.updated'));
    } catch {
      Alert.alert(t('financial.updateError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title={t('financial.title')} description={t('financial.description')}>
      <FieldLabel>{t('profileFields.baseCurrency')}</FieldLabel>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={[styles.select, { borderColor: c.border }]}
      >
        <Text style={[styles.selectText, { color: c.foreground }]}>
          {currencyFlag(currency)} {currency} · {CURRENCY_NAMES[currency]}
        </Text>
        <Text style={{ color: c.mutedForeground }}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open ? (
        <View style={[styles.currencyList, { borderColor: c.border }]}>
          {CURRENCY_CODES.map((code, i) => (
            <Pressable
              key={code}
              onPress={() => {
                setCurrency(code);
                setOpen(false);
              }}
              style={[
                styles.currencyRow,
                i > 0 && {
                  borderTopColor: c.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
                code === currency && { backgroundColor: c.muted },
              ]}
            >
              <Text style={styles.currencyFlag}>{currencyFlag(code)}</Text>
              <Text style={[styles.currencyName, { color: c.foreground }]}>
                {code} · {CURRENCY_NAMES[code]}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <FieldLabel>{t('profileFields.expectedIncome')}</FieldLabel>
      <InputShell>
        <TextInput
          style={[styles.input, { color: c.foreground }]}
          keyboardType='numeric'
          value={income}
          onChangeText={(v) => setIncome(v.replace(/[^0-9.]/g, ''))}
        />
      </InputShell>

      <FieldLabel>{t('profileFields.cycleStartDay')}</FieldLabel>
      <InputShell>
        <TextInput
          style={[styles.input, { color: c.foreground }]}
          keyboardType='numeric'
          value={day}
          onChangeText={(v) => setDay(v.replace(/[^0-9]/g, ''))}
        />
      </InputShell>

      <Button label={t('profileForm.save')} loading={saving} onPress={save} />
    </Section>
  );
}

function ChangePasswordSection() {
  const { t } = useTranslation('auth');
  const schema = useMemo(() => makeChangePasswordSchema(t), [t]);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const passwordValue = useWatch({ control, name: 'password' }) ?? '';

  const onSubmit = handleSubmit(async ({ password }) => {
    clearErrors('root');
    const { error } = await updatePassword(password);
    if (error) {
      setError('root', { message: t('changePassword.error') });
      return;
    }
    reset({ password: '', confirmPassword: '' });
    Alert.alert(t('changePassword.updated'));
  });

  return (
    <Section title={t('changePassword.title')} description={t('changePassword.description')}>
      <PasswordField
        control={control}
        name='password'
        label={t('fields.newPassword')}
        placeholder={t('fields.passwordMinPlaceholder')}
        autoComplete='new-password'
        showError={false}
      />
      <PasswordRules value={passwordValue} />
      {passwordValue.length === 0 ? (
        <FieldError message={errors.password?.message} />
      ) : null}
      <PasswordField
        control={control}
        name='confirmPassword'
        label={t('changePassword.confirmNewPassword')}
        placeholder={t('fields.passwordRepeatPlaceholder')}
        autoComplete='new-password'
      />
      <FieldError message={errors.root?.message} />
      <Button
        label={isSubmitting ? t('changePassword.submitting') : t('changePassword.submit')}
        loading={isSubmitting}
        onPress={onSubmit}
      />
    </Section>
  );
}

function DangerZoneSection() {
  const { t } = useTranslation('auth');
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    Alert.alert(t('dangerZone.dialogTitle'), t('dangerZone.description'), [
      { text: t('dangerZone.title'), style: 'cancel' },
      {
        text: t('dangerZone.button'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            // deleteAccount() invokes the Edge Function and signs out on
            // success; the root guard then routes back to (auth).
            await deleteAccount();
          } catch {
            setDeleting(false);
            Alert.alert(
              t('dangerZone.deleteError', { detail: t('dangerZone.tryAgain') })
            );
          }
        },
      },
    ]);
  }

  return (
    <Section title={t('dangerZone.title')} description={t('dangerZone.description')}>
      <Button
        variant='destructive'
        label={deleting ? t('dangerZone.deleting') : t('dangerZone.button')}
        loading={deleting}
        onPress={confirmDelete}
      />
    </Section>
  );
}

function SignOutButton() {
  const { t } = useTranslation('common');
  return (
    <View style={styles.signOut}>
      <Button
        variant='outline'
        label={t('account.signOut')}
        onPress={() => void supabase.auth.signOut()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.five, paddingBottom: Spacing.six },
  section: { gap: Spacing.three },
  sectionHeader: { gap: Spacing.one },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: 18 },
  sectionDesc: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
  segment: { flexDirection: 'row', gap: Spacing.two },
  segmentItem: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
  },
  segmentText: { fontFamily: Fonts.semibold, fontSize: 14 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  selectText: { fontFamily: Fonts.medium, fontSize: 15 },
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
  signOut: { marginTop: Spacing.two },
});
