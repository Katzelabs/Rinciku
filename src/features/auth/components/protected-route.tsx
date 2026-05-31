import type { ReactNode } from 'react';
import { RequireAuth } from './require-auth';
import { RequireOnboarded } from './require-onboarded';

export function protectedRoute(element: ReactNode) {
  return (
    <RequireAuth>
      <RequireOnboarded>{element}</RequireOnboarded>
    </RequireAuth>
  );
}
