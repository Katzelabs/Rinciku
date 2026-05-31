import { supabase } from '@/lib/supabase';
import type { OnboardingInput, SignInInput } from './schemas';
import type { Profile } from './types';

export async function signInWithPassword(input: SignInInput) {
  return supabase.auth.signInWithPassword(input);
}

// Email normalization (trim + lowercase) is handled by signUpSchema, so the
// input reaching here is already normalized. Don't re-introduce raw form values.
export async function signUpWithPassword(input: {
  email: string;
  password: string;
}) {
  return supabase.auth.signUp(input);
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function upsertProfile(
  userId: string,
  input: OnboardingInput
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        ...input,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
