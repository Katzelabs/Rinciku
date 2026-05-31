import { useState } from 'react';
import { Link } from 'react-router';
import { isAuthApiError, type AuthError } from '@supabase/supabase-js';
import { MailCheckIcon, WalletIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signUpWithPassword } from '../api';
import { RequireGuest } from '../components/require-guest';
import { SignUpForm } from '../components/sign-up-form';
import type { SignUpInput } from '../schemas';

// Map Supabase auth errors to user-facing copy that doesn't leak account
// existence and steers users to the next step. Prefer error.code over message
// strings — messages change with locale/version.
function mapSignUpError(error: AuthError): string {
  if (isAuthApiError(error)) {
    const code = error.code;
    if (
      code === 'user_already_exists' ||
      code === 'email_exists' ||
      error.message === 'User already registered'
    ) {
      return 'If an account already exists for this email, check your inbox for a confirmation link, or try signing in.';
    }
    if (code === 'weak_password') {
      return "That password doesn't meet the requirements above.";
    }
    if (
      code === 'over_email_send_rate_limit' ||
      code === 'over_request_rate_limit'
    ) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

export function SignUpPage() {
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function handleSignUp(
    { email, password }: SignUpInput,
    { setRootError }: { setRootError: (message: string) => void }
  ) {
    const { data, error } = await signUpWithPassword({ email, password });

    if (error) {
      setRootError(mapSignUpError(error));
      return;
    }

    if (!data.session && data.user) {
      setPendingEmail(email);
      return;
    }

    // Session present — the AuthProvider listener picks it up and <RequireGuest>
    // hands off to the requireOnboardedLoader, which redirects to /onboarding.
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
          {pendingEmail ? (
            <>
              <CardHeader className='items-center text-center'>
                <span className='flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <MailCheckIcon className='size-5' />
                </span>
                <CardTitle>Check your email</CardTitle>
                <CardDescription>
                  We sent a confirmation link to{' '}
                  <span className='font-medium text-foreground'>
                    {pendingEmail}
                  </span>
                  . Click the link to activate your account.
                </CardDescription>
              </CardHeader>
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
                <CardTitle>Create your account</CardTitle>
                <CardDescription>
                  Sign up with your email and a password to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignUpForm onSubmit={handleSignUp} />
              </CardContent>
              <CardFooter className='justify-center text-sm text-muted-foreground'>
                <span>
                  Already have an account?{' '}
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

        {!pendingEmail && (
          <p className='max-w-sm text-balance text-center text-xs text-muted-foreground'>
            By creating an account, you agree to our{' '}
            <a
              href='#'
              className='underline underline-offset-2 hover:text-foreground'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='#'
              className='underline underline-offset-2 hover:text-foreground'
            >
              Privacy Policy
            </a>
            .
          </p>
        )}
      </div>
    </RequireGuest>
  );
}
