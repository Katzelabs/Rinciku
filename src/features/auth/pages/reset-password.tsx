import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import type { EmailOtpType } from '@supabase/supabase-js';
import { TriangleAlertIcon, WalletIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LanguageSelect } from '@/components/shared/language-select';
import { supabase } from '@/lib/supabase';
import { updatePassword } from '../api';
import { AuthLoading } from '../components/auth-loading';
import { ResetPasswordForm } from '../components/reset-password-form';
import type { ResetPasswordInput } from '../schemas';

type Status = 'checking' | 'ready' | 'invalid';

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type') as EmailOtpType | null;
    let active = true;

    // The recovery email uses the token_hash flow (see
    // supabase/templates/recovery.html). verifyOtp establishes a short-lived
    // recovery session here — no PKCE code-verifier needed, so it works even
    // when the link is opened on another device.
    async function verify() {
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });
        if (!active) return;
        setStatus(error ? 'invalid' : 'ready');
        return;
      }
      // No token in the URL — only valid if a recovery session already exists
      // (e.g. the user already verified during this visit).
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setStatus(data.session ? 'ready' : 'invalid');
    }

    verify();
    return () => {
      active = false;
    };
  }, []);

  async function handleReset(
    { password }: ResetPasswordInput,
    { setRootError }: { setRootError: (message: string) => void }
  ) {
    const { error } = await updatePassword(password);
    if (error) {
      setRootError(t('resetPassword.error'));
      return;
    }
    // Force a fresh sign-in with the new password.
    await supabase.auth.signOut();
    navigate('/sign-in?reset=success', { replace: true });
  }

  if (status === 'checking') {
    return <AuthLoading />;
  }

  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-4 p-6'>
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

      <div className='flex w-full max-w-sm justify-end'>
        <LanguageSelect />
      </div>

      <Card className='w-full max-w-sm'>
        {status === 'ready' ? (
          <>
            <CardHeader>
              <CardTitle>{t('resetPassword.title')}</CardTitle>
              <CardDescription>
                {t('resetPassword.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResetPasswordForm onSubmit={handleReset} />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className='items-center text-center'>
              <span className='flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
                <TriangleAlertIcon className='size-5' />
              </span>
              <CardTitle>{t('resetPassword.invalid.title')}</CardTitle>
              <CardDescription>
                {t('resetPassword.invalid.description')}
              </CardDescription>
            </CardHeader>
            <CardFooter className='justify-center text-sm text-muted-foreground'>
              <Link
                to='/forgot-password'
                className='font-medium text-foreground underline-offset-4 hover:underline'
              >
                {t('resetPassword.invalid.requestNew')}
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
