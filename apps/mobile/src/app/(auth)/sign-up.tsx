import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAuthApiError, type AuthError } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { Icon } from '@/components/icon';
import { LanguageToggle } from '@/components/language-toggle';
import { resendConfirmation, signUpWithPassword } from '@/features/auth/api';
import { AuthScreenShell } from '@/features/auth/components/auth-screen-shell';
import { Button } from '@/features/auth/components/button';
import { PasswordField } from '@/features/auth/components/password-field';
import { PasswordRules } from '@/features/auth/components/password-rules';
import { FieldError, TextField } from '@/features/auth/components/text-field';
import { TextLink } from '@/features/auth/components/text-link';
import {
  RESEND_COOLDOWN_SECONDS,
  useCooldown,
} from '@/features/auth/hooks/use-cooldown';
import { makeSignUpSchema, type SignUpInput } from '@/features/auth/schemas';
import { useTheme } from '@/hooks/use-theme';

// Map Supabase auth errors to copy that doesn't leak account existence. Prefer
// error.code over message strings — messages change with locale/version.
function mapSignUpError(error: AuthError, t: TFunction): string {
  if (isAuthApiError(error)) {
    const code = error.code;
    if (
      code === 'user_already_exists' ||
      code === 'email_exists' ||
      error.message === 'User already registered'
    ) {
      return t('signUp.errors.exists');
    }
    if (code === 'weak_password') return t('signUp.errors.weakPassword');
    if (
      code === 'over_email_send_rate_limit' ||
      code === 'over_request_rate_limit'
    ) {
      return t('signUp.errors.rateLimit');
    }
  }
  return t('signUp.errors.generic');
}

export default function SignUpScreen() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendFailed, setResendFailed] = useState(false);
  const cooldown = useCooldown();

  const schema = useMemo(() => makeSignUpSchema(t), [t]);
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const passwordValue = useWatch({ control, name: 'password' }) ?? '';

  async function handleResend() {
    if (!pendingEmail || resending || cooldown.active) return;
    setResending(true);
    setResendMessage(null);
    const { error } = await resendConfirmation(pendingEmail);
    setResending(false);
    if (error) {
      setResendFailed(true);
      setResendMessage(
        isAuthApiError(error) &&
          (error.code === 'over_email_send_rate_limit' ||
            error.code === 'over_request_rate_limit')
          ? t('resend.rateLimited')
          : t('resend.error')
      );
      return;
    }
    setResendFailed(false);
    setResendMessage(t('resend.sentInbox'));
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  }

  const onSubmit = handleSubmit(async ({ email, password }) => {
    clearErrors('root');
    const { data, error } = await signUpWithPassword({ email, password });
    if (error) {
      setError('root', { message: mapSignUpError(error, t) });
      return;
    }
    if (!data.session && data.user) {
      setPendingEmail(email);
      cooldown.start(RESEND_COOLDOWN_SECONDS);
      return;
    }
    // Session present — the root guard hands off to onboarding automatically.
  });

  if (pendingEmail) {
    return (
      <AuthScreenShell
        badge='envelope'
        title={t('signUp.checkEmail.title')}
        description={`${t('signUp.checkEmail.descriptionBefore')} ${pendingEmail}${t('signUp.checkEmail.descriptionAfter')}`}
        footer={<TextLink href='/sign-in'>{t('signUp.backToSignIn')}</TextLink>}
      >
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
          <Text
            style={[
              styles.muted,
              { color: resendFailed ? c.destructive : c.mutedForeground },
            ]}
          >
            {resendMessage}
          </Text>
        ) : null}
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      title={t('signUp.title')}
      description={t('signUp.description')}
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.muted, { color: c.mutedForeground }]}>
            {t('signUp.haveAccount')}{' '}
          </Text>
          <TextLink href='/sign-in'>{t('signUp.signInLink')}</TextLink>
        </View>
      }
    >
      <LanguageToggle />

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

        <View>
          <PasswordField
            control={control}
            name='password'
            label={t('fields.password')}
            placeholder={t('fields.passwordMinPlaceholder')}
            autoComplete='new-password'
            showError={false}
          />
          <PasswordRules value={passwordValue} />
          {passwordValue.length === 0 ? (
            <FieldError message={errors.password?.message} />
          ) : null}
        </View>

        <PasswordField
          control={control}
          name='confirmPassword'
          label={t('fields.confirmPassword')}
          placeholder={t('fields.passwordRepeatPlaceholder')}
          autoComplete='new-password'
        />

        <FieldError message={errors.root?.message} />

        <Button
          label={
            isSubmitting ? t('signUpForm.submitting') : t('signUpForm.submit')
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
});
