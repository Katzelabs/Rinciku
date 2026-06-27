import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isAuthApiError } from '@supabase/supabase-js';
import { WalletIcon } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { resendConfirmation, signInWithPassword } from '../api';
import { RequireGuest } from '../components/require-guest';
import { SignInForm } from '../components/sign-in-form';
import { RESEND_COOLDOWN_SECONDS, useCooldown } from '../hooks/use-cooldown';

// Same shape as safeInternalPath in loaders.ts — only allow same-origin paths,
// no protocol-relative URLs.
function safeInternalPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  return value;
}

export function SignInPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const target = safeInternalPath(searchParams.get('redirectTo')) ?? '/';
  const justReset = searchParams.get('reset') === 'success';

  // When a sign-in fails because the email isn't confirmed yet, we surface a
  // resend option here — this survives page reloads, unlike the post-signup
  // "check your email" screen.
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

  return (
    <RequireGuest>
      <div className='flex min-h-svh flex-col items-center justify-center gap-6 p-6'>
        <Link
          to='/'
          className='flex items-center gap-2 text-foreground'
          aria-label='Rinciku'
        >
          <span className='flex size-8 items-center justify-center rounded-2xl bg-primary text-primary-foreground'>
            <WalletIcon className='size-4' />
          </span>
          <span className='font-heading text-lg font-semibold tracking-tight'>
            Rinciku
          </span>
        </Link>

        <Card className='w-full max-w-sm'>
          <CardHeader>
            <CardTitle>{t('signIn.title')}</CardTitle>
            <CardDescription>{t('signIn.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {justReset && (
              <div
                role='status'
                className='mb-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground'
              >
                {t('signIn.resetSuccess')}
              </div>
            )}
            {unverifiedEmail && (
              <div className='mb-4 flex flex-col gap-2 rounded-md border border-border bg-muted/40 px-3 py-3 text-sm'>
                <p className='text-muted-foreground'>
                  {t('signIn.unverifiedMessage')}
                </p>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={handleResend}
                  disabled={resending || cooldown.active}
                >
                  {resending && <Spinner data-icon='inline-start' />}
                  {resending
                    ? t('resend.resending')
                    : cooldown.active
                      ? t('resend.countdown', { seconds: cooldown.remaining })
                      : t('resend.confirmation')}
                </Button>
                {resendMessage && (
                  <p role='status' className='text-xs text-muted-foreground'>
                    {resendMessage}
                  </p>
                )}
              </div>
            )}
            <SignInForm
              onSubmit={async (values, { setRootError }) => {
                const { error } = await signInWithPassword(values);

                if (error) {
                  if (
                    isAuthApiError(error) &&
                    error.code === 'email_not_confirmed'
                  ) {
                    setUnverifiedEmail(values.email);
                    setResendMessage(null);
                    setRootError(t('signIn.errors.emailNotConfirmed'));
                  } else if (
                    isAuthApiError(error) &&
                    (error.code === 'invalid_credentials' ||
                      error.message === 'Invalid login credentials')
                  ) {
                    setRootError(t('signIn.errors.invalidCredentials'));
                  } else {
                    setRootError(t('signIn.errors.generic'));
                  }
                  return;
                }

                navigate(target, { replace: true });
              }}
            />
          </CardContent>
          <CardFooter className='justify-center text-sm text-muted-foreground'>
            <span>
              {t('signIn.noAccount')}{' '}
              <Link
                to='/sign-up'
                className='font-medium text-foreground underline-offset-4 hover:underline'
              >
                {t('signIn.signUpLink')}
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </RequireGuest>
  );
}
