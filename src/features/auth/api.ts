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
        // Income is logged in whatever base is in effect at write time. Future
        // base changes do not retroactively reinterpret this value.
        expected_monthly_income_currency: input.base_currency,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// Partial update for the settings page. The profile row already exists
// post-onboarding, so we .update() instead of upsert and never touch
// onboarded_at. When the patch carries a new income/currency, keep
// expected_monthly_income_currency in sync with the base currency at write
// time (same semantics as upsertProfile).
export async function updateProfile(
  userId: string,
  patch: Partial<OnboardingInput>
): Promise<Profile> {
  const next: Partial<Profile> = { ...patch };
  if (patch.base_currency !== undefined) {
    next.expected_monthly_income_currency = patch.base_currency;
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(next)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

// Deleting an auth user requires the service role, so it runs in the
// delete-account Edge Function. On success the local session is cleared.
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) {
    // FunctionsHttpError carries the real status/body in `context` (a Response);
    // surface it so callers see the actual cause, not a generic message.
    const context = (error as { context?: Response }).context;
    if (context instanceof Response) {
      const body = await context.text().catch(() => '');
      throw new Error(
        `Edge Function failed (${context.status})${body ? `: ${body}` : ''}`
      );
    }
    throw error;
  }
  await supabase.auth.signOut();
}
