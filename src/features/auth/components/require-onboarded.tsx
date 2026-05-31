import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/use-auth';

interface RequireOnboardedProps {
  children: ReactNode;
}

export function RequireOnboarded({ children }: RequireOnboardedProps) {
  const { profile } = useAuth();

  if (!profile?.onboarded_at) {
    return <Navigate to='/onboarding' replace />;
  }

  return <>{children}</>;
}
