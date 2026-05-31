import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/use-auth';
import { AuthLoading } from './auth-loading';

interface RequireGuestProps {
  children: ReactNode;
}

interface LocationState {
  redirectTo?: string;
}

export function RequireGuest({ children }: RequireGuestProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoading />;
  }

  if (session) {
    const state = location.state as LocationState | null;
    return <Navigate to={state?.redirectTo ?? '/'} replace />;
  }

  return <>{children}</>;
}
