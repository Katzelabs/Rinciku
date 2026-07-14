import { useCallback, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface OnboardedEntry {
  userId: string;
  /** undefined = nothing was cached for this user. */
  onboarded: boolean | undefined;
}

// How long the splash may wait on the profile round-trip before falling back to
// the cached onboarding flag. Well under the network timeout: on a healthy
// connection the profile lands in ~200ms and nobody sees this, but on a slow or
// offline one the app boots instead of holding the splash indefinitely.
const PROFILE_BOOT_TIMEOUT_MS = 2_000;

// Only the onboarding flag is cached, NOT the profile row. The row carries email
// and income, and AsyncStorage is plaintext — that's exactly why the session
// lives in SecureStore (see LargeSecureStore). A boolean "has this user finished
// onboarding" is not sensitive, and it's the single fact the root guard needs to
// pick a branch before the network answers.
const onboardedKey = (userId: string) => `rinciku-onboarded:${userId}`;

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileEntry, setProfileEntry] = useState<ProfileEntry | null>(null);

  // Both of these are keyed by user id and *derived* against the current one
  // below, rather than reset in an effect — resetting would mean a synchronous
  // setState in an effect body, which cascades renders (and React Compiler's
  // lint rejects it).
  const [onboardedEntry, setOnboardedEntry] = useState<OnboardedEntry | null>(
    null
  );
  const [timedOutUserId, setTimedOutUserId] = useState<string | null>(null);

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

  const writeOnboardedCache = useCallback(
    (uid: string, profile: Profile | null) => {
      AsyncStorage.setItem(
        onboardedKey(uid),
        profile?.onboarded_at ? '1' : '0'
      ).catch(() => {
        // A cache write failure only costs us the fast path on the next boot.
      });
    },
    []
  );

  const loadProfile = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      if (error) {
        console.error('Failed to load profile', error);
      }
      setProfileEntry({ userId: uid, profile: data ?? null });
      if (!error) writeOnboardedCache(uid, data ?? null);
    },
    [writeOnboardedCache]
  );

  // Read the cached onboarding flag as soon as we know who the user is. This is
  // a local AsyncStorage hit, so it resolves in ~ms regardless of the network.
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    AsyncStorage.getItem(onboardedKey(userId))
      .then((value) => {
        if (cancelled) return;
        setOnboardedEntry({
          userId,
          onboarded: value === null ? undefined : value === '1',
        });
      })
      .catch(() => {
        if (!cancelled) setOnboardedEntry({ userId, onboarded: undefined });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

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
        if (!error) writeOnboardedCache(userId, data ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, writeOnboardedCache]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    await loadProfile(userId);
  }, [userId, loadProfile]);

  const profileMatchesUser = userId !== null && profileEntry?.userId === userId;
  const profile = profileMatchesUser ? profileEntry!.profile : null;
  const profileLoading = userId !== null && !profileMatchesUser;

  // Bound the splash's wait on the profile fetch. The timer starts when a
  // signed-in user's profile is still in flight and is torn down the moment it
  // lands, so it only ever fires on a genuinely slow/offline boot.
  useEffect(() => {
    if (!profileLoading || !userId) return;
    const timer = setTimeout(
      () => setTimedOutUserId(userId),
      PROFILE_BOOT_TIMEOUT_MS
    );
    return () => clearTimeout(timer);
  }, [profileLoading, userId]);

  // undefined = either "not read yet" or "nothing cached". Both must keep the
  // splash up, so they collapse to the same value on purpose.
  const cachedOnboarded =
    userId !== null && onboardedEntry?.userId === userId
      ? onboardedEntry.onboarded
      : undefined;

  // The timeout only helps if the cache can answer the routing question. With no
  // cached flag there is nothing to route on, so keep waiting rather than risk
  // dropping an already-onboarded user into the wizard. That case is rare: any
  // successful sign-in fetches the profile and writes the cache, so a signed-in
  // user without one has never completed a single profile fetch on this device.
  const bootTimedOut = userId !== null && timedOutUserId === userId;
  const canBootWithoutProfile = bootTimedOut && cachedOnboarded !== undefined;
  const loading = sessionLoading || (profileLoading && !canBootWithoutProfile);

  // The root guard needs this before the profile resolves. Prefer the live row
  // once it lands; until then fall back to the cached flag.
  const onboarded = profileMatchesUser
    ? !!profile?.onboarded_at
    : (cachedOnboarded ?? false);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        onboarded,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
