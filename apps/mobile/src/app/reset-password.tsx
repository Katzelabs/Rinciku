import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { EmailOtpType } from '@supabase/supabase-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { updatePassword } from '@/features/auth/api';
import { AuthScreenShell } from '@/features/auth/components/auth-screen-shell';
import { Button } from '@/features/auth/components/button';
import { Notice } from '@/features/auth/components/notice';
import { PasswordField } from '@/features/auth/components/password-field';
import { PasswordRules } from '@/features/auth/components/password-rules';
import { FieldError } from '@/features/auth/components/text-field';
import { TextLink } from '@/features/auth/components/text-link';
import {
  makeResetPasswordSchema,
  type ResetPasswordInput,
} from '@/features/auth/schemas';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Status = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordScreen() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const router = useRouter();
  const params = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
  }>();
  const [status, setStatus] = useState<Status>('checking');

  const schema = useMemo(() => makeResetPasswordSchema(t), [t]);
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = useWatch({ control, name: 'password' }) ?? '';

  useEffect(() => {
    let active = true;

    // The recovery email uses the token_hash flow — verifyOtp establishes a
    // short-lived recovery session without a PKCE verifier, so it works even
    // when the link opens on a different device. `detectSessionInUrl:false`
    // means nothing happens automatically; we must handle it here.
    async function verify() {
      const tokenHash = params.token_hash;
      const type = params.type as EmailOtpType | undefined;
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });
        if (!active) return;
        setStatus(error ? 'invalid' : 'ready');
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setStatus(data.session ? 'ready' : 'invalid');
    }

    // Fallback: if Supabase sets the session from the link before this screen
    // parses params, the PASSWORD_RECOVERY event flips us to ready.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && active) setStatus('ready');
    });

    verify();
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [params.token_hash, params.type]);

  const onSubmit = handleSubmit(async ({ password }) => {
    clearErrors('root');
    const { error } = await updatePassword(password);
    if (error) {
      setError('root', { message: t('resetPassword.error') });
      return;
    }
    // Force a fresh sign-in with the new password.
    await supabase.auth.signOut();
    router.replace('/sign-in?reset=success');
  });

  if (status === 'checking') {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthScreenShell
        title={t('resetPassword.invalid.title')}
        footer={
          <TextLink href='/forgot-password'>
            {t('resetPassword.invalid.requestNew')}
          </TextLink>
        }
      >
        <Notice tone='error'>{t('resetPassword.invalid.description')}</Notice>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      title={t('resetPassword.title')}
      description={t('resetPassword.description')}
    >
      <View style={styles.form}>
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
          label={
            isSubmitting
              ? t('resetPasswordForm.submitting')
              : t('resetPasswordForm.submit')
          }
          loading={isSubmitting}
          onPress={onSubmit}
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  form: { gap: Spacing.three },
});
