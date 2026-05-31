import type { RouteObject } from 'react-router';

// /sign-in, /sign-up — wired under requireGuestLoader in src/app/router.tsx.
// Components may still use <RequireGuest> as belt-and-suspenders for in-tree
// session changes.
export const guestRoutes: RouteObject[] = [];

// /onboarding — wired under requireAuthLoader in src/app/router.tsx (NOT
// requireOnboardedLoader; setting onboarded_at is the point of this page).
export const onboardingRoutes: RouteObject[] = [];
