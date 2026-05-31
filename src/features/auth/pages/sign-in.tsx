import { isAuthApiError } from '@supabase/supabase-js';
import { WalletIcon } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signInWithPassword } from '../api';
import { RequireGuest } from '../components/require-guest';
import { SignInForm } from '../components/sign-in-form';

// Same shape as safeInternalPath in loaders.ts — only allow same-origin paths,
// no protocol-relative URLs.
function safeInternalPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  return value;
}

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const target = safeInternalPath(searchParams.get('redirectTo')) ?? '/';

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
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in with your email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInForm
              onSubmit={async (values, { setRootError }) => {
                const { error } = await signInWithPassword(values);

                if (error) {
                  if (
                    isAuthApiError(error) &&
                    (error.code === 'invalid_credentials' ||
                      error.message === 'Invalid login credentials')
                  ) {
                    setRootError('Email or password is incorrect');
                  } else {
                    setRootError('Something went wrong. Please try again.');
                  }
                  return;
                }

                navigate(target, { replace: true });
              }}
            />
          </CardContent>
          <CardFooter className='justify-center text-sm text-muted-foreground'>
            <span>
              Don&apos;t have an account?{' '}
              <Link
                to='/sign-up'
                className='font-medium text-foreground underline-offset-4 hover:underline'
              >
                Sign up
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </RequireGuest>
  );
}
