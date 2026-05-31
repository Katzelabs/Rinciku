import type { RouteObject } from 'react-router';
import { RequireGuest } from './components/require-guest';
import { AccountPage } from './pages/account';
import { OnboardingPage } from './pages/onboarding';
import { SignInPage } from './pages/sign-in';
import { SignUpPage } from './pages/sign-up';

// /sign-in, /sign-up — wired under requireGuestLoader in src/app/router.tsx.
// Components may still use <RequireGuest> as belt-and-suspenders for in-tree
// session changes.
export const guestRoutes: RouteObject[] = [
  {
    path: '/sign-in',
    element: (
      <RequireGuest>
        <SignInPage />
      </RequireGuest>
    ),
  },
  { path: '/sign-up', element: <SignUpPage /> },
];

// /onboarding — wired under requireAuthLoader in src/app/router.tsx (NOT
// requireOnboardedLoader; setting onboarded_at is the point of this page).
export const onboardingRoutes: RouteObject[] = [
  { path: '/onboarding', element: <OnboardingPage /> },
];

// Auth-adjacent routes for already-onboarded users (account settings, etc.).
// Spread into the AppShell children in src/app/router.tsx so they inherit
// requireOnboardedLoader alongside the rest of the app.
export const authRoutes: RouteObject[] = [
  { path: '/account', element: <AccountPage /> },
];
