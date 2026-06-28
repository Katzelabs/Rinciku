import type { RouteObject } from 'react-router';
import { PrivacyPage } from './pages/privacy';
import { TermsPage } from './pages/terms';

// /terms, /privacy — public legal documents. Wired as standalone children of
// RootLayout in app/router.tsx (NOT under any auth/guest/onboarded guard) so
// they are reachable by signed-out visitors and signed-in users alike.
export const legalRoutes: RouteObject[] = [
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
];
