import { useState } from 'react';
import { Link } from 'react-router';
import { MailCheckIcon, WalletIcon } from 'lucide-react';
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
import { requestPasswordReset } from '../api';
import { ForgotPasswordForm } from '../components/forgot-password-form';
import { RequireGuest } from '../components/require-guest';
import { RESEND_COOLDOWN_SECONDS, useCooldown } from '../hooks/use-cooldown';
import type { ForgotPasswordInput } from '../schemas';

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);
  const cooldown = useCooldown();

  async function handleRequest({ email }: ForgotPasswordInput) {
    // Fire the reset email but always show the same success state regardless of
    // the result, so we never reveal whether an account exists for this email.
    await requestPasswordReset(email);
    setSentTo(email);
    cooldown.start(RESEND_COOLDOWN_SECONDS);
  }

  async function handleResend() {
    if (!sentTo || resending || cooldown.active) return;
    setResending(true);
    setResentMessage(null);
    await requestPasswordReset(sentTo);
    setResending(false);
    setResentMessage('Sent! Check your inbox again.');
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
          {sentTo ? (
            <>
              <CardHeader className='items-center text-center'>
                <span className='flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <MailCheckIcon className='size-5' />
                </span>
                <CardTitle>Check your email</CardTitle>
                <CardDescription>
                  If an account exists for{' '}
                  <span className='font-medium text-foreground'>{sentTo}</span>,
                  we sent a link to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col items-center gap-2 text-center'>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={handleResend}
                  disabled={resending || cooldown.active}
                >
                  {resending && <Spinner data-icon='inline-start' />}
                  {resending
                    ? 'Resending…'
                    : cooldown.active
                      ? `Resend in ${cooldown.remaining}s`
                      : 'Resend reset link'}
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
                  Back to sign in
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Forgot your password?</CardTitle>
                <CardDescription>
                  Enter your email and we&apos;ll send you a link to reset it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ForgotPasswordForm onSubmit={handleRequest} />
              </CardContent>
              <CardFooter className='justify-center text-sm text-muted-foreground'>
                <span>
                  Remembered it?{' '}
                  <Link
                    to='/sign-in'
                    className='font-medium text-foreground underline-offset-4 hover:underline'
                  >
                    Sign in
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
