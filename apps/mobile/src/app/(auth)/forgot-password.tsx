import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { Icon } from '@/components/icon';
import { LanguageToggle } from '@/components/language-toggle';
import { requestPasswordReset } from '@/features/auth/api';
import { AuthScreenShell } from '@/features/auth/components/auth-screen-shell';
import { Button } from '@/features/auth/components/button';
import { TextField } from '@/features/auth/components/text-field';
import { TextLink } from '@/features/auth/components/text-link';
import {
  RESEND_COOLDOWN_SECONDS,
  useCooldown,
} from '@/features/auth/hooks/use-cooldown';
import {
  makeForgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/features/auth/schemas';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);
  const cooldown = useCooldown();

  const schema = useMemo(() => makeForgotPasswordSchema(t), [t]);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    // Always show the same success state regardless of result, so we never
    // reveal whether an account exists for this email.
    await requestPasswordReset(email);
    setSentTo(email);
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  });

  async function handleResend() {
    if (!sentTo || resending || cooldown.active) return;
    setResending(true);
    setResentMessage(null);
    await requestPasswordReset(sentTo);
    setResending(false);
    setResentMessage(t('resend.sentInbox'));
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  }

  if (sentTo) {
    return (
      <AuthScreenShell
        badge='envelope'
        title={t('forgotPassword.checkEmail.title')}
        description={`${t('forgotPassword.checkEmail.descriptionBefore')} ${sentTo}${t('forgotPassword.checkEmail.descriptionAfter')}`}
        footer={
          <TextLink href='/sign-in'>
            {t('forgotPassword.backToSignIn')}
          </TextLink>
        }
      >
        <Button
          variant='outline'
          label={
            resending
              ? t('resend.resending')
              : cooldown.active
                ? t('resend.countdown', { seconds: cooldown.remaining })
                : t('resend.resetLink')
          }
          loading={resending}
          disabled={cooldown.active}
          onPress={handleResend}
        />
        {resentMessage ? (
          <Text style={[styles.muted, { color: c.mutedForeground }]}>
            {resentMessage}
          </Text>
        ) : null}
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      title={t('forgotPassword.title')}
      description={t('forgotPassword.description')}
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.muted, { color: c.mutedForeground }]}>
            {t('forgotPassword.remembered')}{' '}
          </Text>
          <TextLink href='/sign-in'>{t('forgotPassword.signInLink')}</TextLink>
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
        <Button
          label={
            isSubmitting
              ? t('forgotPasswordForm.submitting')
              : t('forgotPasswordForm.submit')
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
