import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import type { EmailOtpType } from '@supabase/supabase-js';
import { TriangleAlertIcon } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LanguageSelect } from '@/components/shared/language-select';
import { supabase } from '@/lib/supabase';
import { AuthLoading } from '../components/auth-loading';

// Landing route for the signup confirmation link. The email uses the
// token_hash flow (see supabase/templates/confirmation.html), so we verify it
// here with verifyOtp — this needs no PKCE code-verifier and works even when
// the link is opened on a different device than the one that signed up. On
// success the session is established and requireOnboardedLoader routes new
// users to /onboarding.
export function AuthCallbackPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type') as EmailOtpType | null;
    let active = true;

    async function confirm() {
      if (!tokenHash || !type) {
        setFailed(true);
        return;
      }
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!active) return;
      if (error) {
        setFailed(true);
        return;
      }
      navigate('/', { replace: true });
    }

    confirm();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (!failed) {
    return <AuthLoading />;
  }

  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-4 p-6'>
      <Link to='/' aria-label='Rinciku'>
        <Logo />
      </Link>

      <div className='flex w-full max-w-sm justify-end'>
        <LanguageSelect />
      </div>

      <Card className='w-full max-w-sm'>
        <CardHeader className='items-center text-center'>
          <span className='flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
            <TriangleAlertIcon className='size-5' />
          </span>
          <CardTitle>{t('authCallback.title')}</CardTitle>
          <CardDescription>{t('authCallback.description')}</CardDescription>
        </CardHeader>
        <CardFooter className='justify-center gap-4 text-sm text-muted-foreground'>
          <Link
            to='/sign-in'
            className='font-medium text-foreground underline-offset-4 hover:underline'
          >
            {t('authCallback.signIn')}
          </Link>
          <Link
            to='/sign-up'
            className='font-medium text-foreground underline-offset-4 hover:underline'
          >
            {t('authCallback.signUp')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
