import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAuthApiError } from '@supabase/supabase-js';
import { useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { Icon } from '@/components/icon';
import { LanguageToggle } from '@/components/language-toggle';
import { signInWithPassword, resendConfirmation } from '@/features/auth/api';
import { AuthScreenShell } from '@/features/auth/components/auth-screen-shell';
import { Button } from '@/features/auth/components/button';
import { Notice } from '@/features/auth/components/notice';
import { PasswordField } from '@/features/auth/components/password-field';
import { FieldError, TextField } from '@/features/auth/components/text-field';
import { TextLink } from '@/features/auth/components/text-link';
import {
  RESEND_COOLDOWN_SECONDS,
  useCooldown,
} from '@/features/auth/hooks/use-cooldown';
import { makeSignInSchema, type SignInInput } from '@/features/auth/schemas';
import { useTheme } from '@/hooks/use-theme';

export default function SignInScreen() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const params = useLocalSearchParams<{ reset?: string; deleted?: string }>();
  const justReset = params.reset === 'success';
  const justDeleted = params.deleted === 'success';

  const schema = useMemo(() => makeSignInSchema(t), [t]);
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  // Surfaced when sign-in fails because the email isn't confirmed yet.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const cooldown = useCooldown();

  async function handleResend() {
    if (!unverifiedEmail || resending || cooldown.active) return;
    setResending(true);
    setResendMessage(null);
    const { error } = await resendConfirmation(unverifiedEmail);
    setResending(false);
    if (error) {
      setResendMessage(
        isAuthApiError(error) &&
          (error.code === 'over_email_send_rate_limit' ||
            error.code === 'over_request_rate_limit')
          ? t('resend.rateLimited')
          : t('resend.error')
      );
      return;
    }
    setResendMessage(t('resend.confirmationSent'));
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  }

  const onSubmit = handleSubmit(async (values) => {
    clearErrors('root');
    const { error } = await signInWithPassword(values);
    if (!error) {
      // Success: AuthProvider picks up the session and the root guard routes to
      // the app (or onboarding). Nothing to navigate here.
      return;
    }
    if (isAuthApiError(error) && error.code === 'email_not_confirmed') {
      setUnverifiedEmail(values.email);
      setResendMessage(null);
      setError('root', { message: t('signIn.errors.emailNotConfirmed') });
    } else if (
      isAuthApiError(error) &&
      (error.code === 'invalid_credentials' ||
        error.message === 'Invalid login credentials')
    ) {
      setError('root', { message: t('signIn.errors.invalidCredentials') });
    } else {
      setError('root', { message: t('signIn.errors.generic') });
    }
  });

  return (
    <AuthScreenShell
      title={t('signIn.title')}
      description={t('signIn.description')}
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.muted, { color: c.mutedForeground }]}>
            {t('signIn.noAccount')}{' '}
          </Text>
          <TextLink href='/sign-up'>{t('signIn.signUpLink')}</TextLink>
        </View>
      }
    >
      <LanguageToggle />

      {justReset ? <Notice>{t('signIn.resetSuccess')}</Notice> : null}
      {justDeleted ? <Notice>{t('signIn.deletedSuccess')}</Notice> : null}

      {unverifiedEmail ? (
        <View style={styles.resendBox}>
          <Text style={[styles.muted, { color: c.mutedForeground }]}>
            {t('signIn.unverifiedMessage')}
          </Text>
          <Button
            variant='outline'
            label={
              resending
                ? t('resend.resending')
                : cooldown.active
                  ? t('resend.countdown', { seconds: cooldown.remaining })
                  : t('resend.confirmation')
            }
            loading={resending}
            disabled={cooldown.active}
            onPress={handleResend}
          />
          {resendMessage ? (
            <Text style={[styles.muted, { color: c.mutedForeground }]}>
              {resendMessage}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.form}>
        <TextField
          control={control}
          name='email'
          label={t('fields.email')}
          leading={<Icon name='envelope' size={18} />}
          placeholder={t('fields.emailPlaceholder')}
          keyboardType='email-address'
          autoCapitalize='none'
          autoComplete='email'
          autoCorrect={false}
        />

        <View style={styles.passwordHeader}>
          <Text style={[styles.passwordLabel, { color: c.foreground }]}>
            {t('fields.password')}
          </Text>
          <TextLink href='/forgot-password'>
            {t('signInForm.forgotPassword')}
          </TextLink>
        </View>
        <PasswordField
          control={control}
          name='password'
          placeholder={t('signInForm.passwordPlaceholder')}
          autoComplete='password'
        />

        <FieldError message={errors.root?.message} />

        <Button
          label={
            isSubmitting ? t('signInForm.submitting') : t('signInForm.submit')
          }
          loading={isSubmitting}
          onPress={onSubmit}
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  muted: { fontFamily: Fonts.regular, fontSize: 14 },
  resendBox: { gap: Spacing.two },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordLabel: { fontFamily: Fonts.medium, fontSize: 14 },
});
