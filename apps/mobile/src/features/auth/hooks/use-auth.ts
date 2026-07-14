import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import type { Profile } from '../types';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /**
   * Whether the user has finished onboarding. Prefer this over
   * `profile?.onboarded_at` for routing: the profile row arrives over the
   * network, but this is backed by a local cache so it can answer on a cold,
   * slow, or offline boot without holding the splash screen.
   */
  onboarded: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
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
