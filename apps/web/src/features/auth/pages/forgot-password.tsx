import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { MailCheckIcon } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LanguageSelect } from '@/components/shared/language-select';
import { Spinner } from '@/components/ui/spinner';
import { requestPasswordReset } from '../api';
import { useCaptcha } from '../components/captcha';
import { ForgotPasswordForm } from '../components/forgot-password-form';
import { RequireGuest } from '../components/require-guest';
import { RESEND_COOLDOWN_SECONDS, useCooldown } from '../hooks/use-cooldown';
import type { ForgotPasswordInput } from '../schemas';

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);
  const cooldown = useCooldown();
  // The recover endpoint is captcha-gated too when [auth.captcha] is on, so
  // the check-email screen carries its own widget for the resend button.
  const resendCaptcha = useCaptcha();

  async function handleRequest(
    { email }: ForgotPasswordInput,
    { captchaToken }: { captchaToken?: string }
  ) {
    // Fire the reset email but always show the same success state regardless of
    // the result, so we never reveal whether an account exists for this email.
    await requestPasswordReset(email, captchaToken);
    setSentTo(email);
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  }

  async function handleResend() {
    if (!sentTo || resending || cooldown.active) return;
    setResending(true);
    setResentMessage(null);
    await requestPasswordReset(sentTo, resendCaptcha.token);
    resendCaptcha.reset();
    setResending(false);
    setResentMessage(t('resend.sentInbox'));
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <RequireGuest>
      <div className='flex min-h-svh flex-col items-center justify-center gap-4 p-6'>
        <Link to='/' aria-label='Rinciku'>
          <Logo />
        </Link>

        <div className='flex w-full max-w-sm justify-end'>
          <LanguageSelect />
        </div>

        <Card className='w-full max-w-sm'>
          {sentTo ? (
            <>
              <CardHeader className='items-center text-center'>
                <span className='flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <MailCheckIcon className='size-5' />
                </span>
                <CardTitle>{t('forgotPassword.checkEmail.title')}</CardTitle>
                <CardDescription>
                  {t('forgotPassword.checkEmail.descriptionBefore')}{' '}
                  <span className='font-medium text-foreground'>{sentTo}</span>
                  {t('forgotPassword.checkEmail.descriptionAfter')}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col items-center gap-2 text-center'>
                {resendCaptcha.widget}
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={handleResend}
                  disabled={
                    resending || cooldown.active || !resendCaptcha.ready
                  }
                >
                  {resending && <Spinner data-icon='inline-start' />}
                  {resending
                    ? t('resend.resending')
                    : cooldown.active
                      ? t('resend.countdown', { seconds: cooldown.remaining })
                      : t('resend.resetLink')}
                </Button>
                {resentMessage && (
                  <p role='status' className='text-xs text-muted-foreground'>
                    {resentMessage}
                  </p>
                )}
              </CardContent>
              <CardFooter className='justify-center text-sm text-muted-foreground'>
                <Link
                  to='/sign-in'
                  className='font-medium text-foreground underline-offset-4 hover:underline'
                >
                  {t('forgotPassword.backToSignIn')}
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>{t('forgotPassword.title')}</CardTitle>
                <CardDescription>
                  {t('forgotPassword.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ForgotPasswordForm onSubmit={handleRequest} />
              </CardContent>
              <CardFooter className='justify-center text-sm text-muted-foreground'>
                <span>
                  {t('forgotPassword.remembered')}{' '}
                  <Link
                    to='/sign-in'
                    className='font-medium text-foreground underline-offset-4 hover:underline'
                  >
                    {t('forgotPassword.signInLink')}
                  </Link>
                </span>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </RequireGuest>
  );
}
