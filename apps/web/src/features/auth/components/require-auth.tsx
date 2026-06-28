import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/use-auth';
import { AuthLoading } from './auth-loading';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoading />;
  }

  if (!session) {
    return (
      <Navigate
        to='/sign-in'
        replace
        state={{ redirectTo: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
}
