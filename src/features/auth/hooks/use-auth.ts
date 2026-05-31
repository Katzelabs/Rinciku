import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
