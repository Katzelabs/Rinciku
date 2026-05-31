import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContext } from '../hooks/use-auth';
import type { Profile } from '../types';

interface AuthProviderProps {
  children: ReactNode;
}

interface ProfileEntry {
  userId: string;
  profile: Profile | null;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileEntry, setProfileEntry] = useState<ProfileEntry | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setSessionLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next);
      }
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load profile', error);
        }
        setProfileEntry({ userId, profile: data ?? null });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const profileMatchesUser = userId !== null && profileEntry?.userId === userId;
  const profile = profileMatchesUser ? profileEntry!.profile : null;
  const profileLoading = userId !== null && !profileMatchesUser;
  const loading = sessionLoading || profileLoading;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
