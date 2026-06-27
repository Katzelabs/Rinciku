import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { isAuthApiError, type AuthError } from '@supabase/supabase-js';
import type { TFunction } from 'i18next';
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
import { resendConfirmation, signUpWithPassword } from '../api';
import { RESEND_COOLDOWN_SECONDS, useCooldown } from '../hooks/use-cooldown';
import { RequireGuest } from '../components/require-guest';
import { SignUpForm } from '../components/sign-up-form';
import type { SignUpInput } from '../schemas';

// Map Supabase auth errors to user-facing copy that doesn't leak account
// existence and steers users to the next step. Prefer error.code over message
// strings — messages change with locale/version.
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
    if (code === 'weak_password') {
      return t('signUp.errors.weakPassword');
    }
    if (
      code === 'over_email_send_rate_limit' ||
      code === 'over_request_rate_limit'
    ) {
      return t('signUp.errors.rateLimit');
    }
  }
  return t('signUp.errors.generic');
}

type ResendState = 'idle' | 'sending' | 'sent' | 'error';

export function SignUpPage() {
  const { t } = useTranslation('auth');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resend, setResend] = useState<ResendState>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const cooldown = useCooldown();

  async function handleResend() {
    if (!pendingEmail || resend === 'sending' || cooldown.active) return;
    setResend('sending');
    setResendMessage(null);
    const { error } = await resendConfirmation(pendingEmail);
    if (error) {
      setResend('error');
      setResendMessage(
        isAuthApiError(error) &&
          (error.code === 'over_email_send_rate_limit' ||
            error.code === 'over_request_rate_limit')
          ? t('resend.rateLimited')
          : t('resend.error')
      );
      return;
    }
    setResend('sent');
    setResendMessage(t('resend.sentInbox'));
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  }

  async function handleSignUp(
    { email, password }: SignUpInput,
    { setRootError }: { setRootError: (message: string) => void }
  ) {
    const { data, error } = await signUpWithPassword({ email, password });

    if (error) {
      setRootError(mapSignUpError(error, t));
      return;
    }

    if (!data.session && data.user) {
      setPendingEmail(email);
      // The signup confirmation email just went out — arm the cooldown so the
      // resend button starts disabled.
      cooldown.start(RESEND_COOLDOWN_SECONDS);
      return;
    }

    // Session present — the AuthProvider listener picks it up and <RequireGuest>
    // hands off to the requireOnboardedLoader, which redirects to /onboarding.
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
          {pendingEmail ? (
            <>
              <CardHeader className='items-center text-center'>
                <span className='flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <MailCheckIcon className='size-5' />
                </span>
                <CardTitle>{t('signUp.checkEmail.title')}</CardTitle>
                <CardDescription>
                  {t('signUp.checkEmail.descriptionBefore')}{' '}
                  <span className='font-medium text-foreground'>
                    {pendingEmail}
                  </span>
                  {t('signUp.checkEmail.descriptionAfter')}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col items-center gap-2 text-center'>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={handleResend}
                  disabled={resend === 'sending' || cooldown.active}
                >
                  {resend === 'sending' && <Spinner data-icon='inline-start' />}
                  {resend === 'sending'
                    ? t('resend.resending')
                    : cooldown.active
                      ? t('resend.countdown', { seconds: cooldown.remaining })
                      : t('resend.confirmation')}
                </Button>
                {resendMessage && (
                  <p
                    role='status'
                    className={
                      resend === 'error'
                        ? 'text-xs text-destructive'
                        : 'text-xs text-muted-foreground'
                    }
                  >
                    {resendMessage}
                  </p>
                )}
              </CardContent>
              <CardFooter className='justify-center text-sm text-muted-foreground'>
                <Link
                  to='/sign-in'
                  className='font-medium text-foreground underline-offset-4 hover:underline'
                >
                  {t('signUp.backToSignIn')}
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>{t('signUp.title')}</CardTitle>
                <CardDescription>{t('signUp.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <SignUpForm onSubmit={handleSignUp} />
              </CardContent>
              <CardFooter className='justify-center text-sm text-muted-foreground'>
                <span>
                  {t('signUp.haveAccount')}{' '}
                  <Link
                    to='/sign-in'
                    className='font-medium text-foreground underline-offset-4 hover:underline'
                  >
                    {t('signUp.signInLink')}
                  </Link>
                </span>
              </CardFooter>
            </>
          )}
        </Card>

        {!pendingEmail && (
          <p className='max-w-sm text-balance text-center text-xs text-muted-foreground'>
            {t('signUp.terms.prefix')}{' '}
            <Link
              to='/terms'
              target='_blank'
              rel='noreferrer'
              className='underline underline-offset-2 hover:text-foreground'
            >
              {t('signUp.terms.tos')}
            </Link>{' '}
            {t('signUp.terms.and')}{' '}
            <Link
              to='/privacy'
              target='_blank'
              rel='noreferrer'
              className='underline underline-offset-2 hover:text-foreground'
            >
              {t('signUp.terms.privacy')}
            </Link>
            .
          </p>
        )}
      </div>
    </RequireGuest>
  );
}
