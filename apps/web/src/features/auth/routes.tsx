import type { RouteObject } from 'react-router';
import { RequireGuest } from './components/require-guest';
import { AuthCallbackPage } from './pages/auth-callback';
import { ForgotPasswordPage } from './pages/forgot-password';
import { ResetPasswordPage } from './pages/reset-password';
import { SettingsPage } from './pages/settings';
import { OnboardingPage } from './pages/onboarding';
import { SignInPage } from './pages/sign-in';
import { SignUpPage } from './pages/sign-up';

// /sign-in, /sign-up — wired under requireGuestLoader in src/app/router.tsx.
// Components may still use <RequireGuest> as belt-and-suspenders for in-tree
// session changes.
export const guestRoutes: RouteObject[] = [
  {
    path: '/sign-in',
    handle: { title: 'auth:signIn.title' },
    element: (
      <RequireGuest>
        <SignInPage />
      </RequireGuest>
    ),
  },
  {
    path: '/sign-up',
    handle: { title: 'auth:signUp.title' },
    element: <SignUpPage />,
  },
  {
    path: '/forgot-password',
    handle: { title: 'auth:forgotPassword.title' },
    element: (
      <RequireGuest>
        <ForgotPasswordPage />
      </RequireGuest>
    ),
  },
];

// Public landing routes for email links (signup confirmation, password
// recovery). These must NOT sit under requireGuestLoader: the confirmation /
// recovery link auto-establishes a session via detectSessionInUrl, which the
// guest loader would treat as "already signed in" and redirect away before the
// page can act. Wired as standalone children of RootLayout in app/router.tsx.
export const authPublicRoutes: RouteObject[] = [
  {
    path: '/reset-password',
    handle: { title: 'auth:resetPassword.title' },
    element: <ResetPasswordPage />,
  },
  {
    path: '/auth/callback',
    handle: { title: 'auth:authCallback.title' },
    element: <AuthCallbackPage />,
  },
];

// /onboarding — wired under requireAuthLoader in src/app/router.tsx (NOT
// requireOnboardedLoader; setting onboarded_at is the point of this page).
export const onboardingRoutes: RouteObject[] = [
  {
    path: '/onboarding',
    handle: { title: 'auth:onboarding.title' },
    element: <OnboardingPage />,
  },
];

// Auth-adjacent routes for already-onboarded users (account settings, etc.).
// Spread into the AppShell children in src/app/router.tsx so they inherit
// requireOnboardedLoader alongside the rest of the app.
export const authRoutes: RouteObject[] = [
  {
    path: '/settings',
    handle: { title: 'settings.title' },
    element: <SettingsPage />,
  },
];
