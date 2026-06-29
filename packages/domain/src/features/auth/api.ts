import type { TypedSupabaseClient } from '@rinciku/db';
import type { OnboardingInput, SignInInput } from './schemas';
import type { Profile } from './types';

/**
 * Post-confirmation/recovery redirect targets. Injected because they're
 * platform-specific: web builds them from `window.location.origin`, while a
 * native app uses its deep-link scheme. Functions (not strings) so the value is
 * read at call time.
 */
export interface AuthRedirects {
  /** Where the signup confirmation email link should land. */
  emailConfirm: () => string;
  /** Where the password-reset email link should land. */
  passwordReset: () => string;
}

/**
 * Auth + profile data layer. The Supabase client and redirect targets are
 * injected so the same code runs on web and native.
 */
export function createAuthApi(
  db: TypedSupabaseClient,
  redirects: AuthRedirects
) {
  async function signInWithPassword(input: SignInInput) {
    return db.auth.signInWithPassword(input);
  }

  // Email confirmation is enabled (supabase/config.toml), so signUp returns a
  // user with no session and sends a confirmation email. The link lands on the
  // injected emailConfirm target, which exchanges the code and routes onward.
  //
  // Email normalization (trim + lowercase) is handled by signUpSchema, so the
  // input reaching here is already normalized. Don't re-introduce raw form values.
  async function signUpWithPassword(input: { email: string; password: string }) {
    return db.auth.signUp({
      ...input,
      options: { emailRedirectTo: redirects.emailConfirm() },
    });
  }

  // Resend the signup confirmation email (e.g. the first one didn't arrive).
  // Rate-limited by Supabase (auth.email.max_frequency, rate_limit.email_sent).
  async function resendConfirmation(email: string) {
    return db.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirects.emailConfirm() },
    });
  }

  // Send a password-reset email. The link lands on the injected passwordReset
  // target, where the recovery session is established and the user sets a new password.
  async function requestPasswordReset(email: string) {
    return db.auth.resetPasswordForEmail(email, {
      redirectTo: redirects.passwordReset(),
    });
  }

  async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  async function upsertProfile(
    userId: string,
    input: OnboardingInput
  ): Promise<Profile> {
    const { data, error } = await db
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
  async function updateProfile(
    userId: string,
    patch: Partial<OnboardingInput>
  ): Promise<Profile> {
    const next: Partial<Profile> = { ...patch };
    if (patch.base_currency !== undefined) {
      next.expected_monthly_income_currency = patch.base_currency;
    }
    const { data, error } = await db
      .from('profiles')
      .update(next)
      .eq('id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  // Persist the UI language to the profile so it follows the user across devices.
  // The picker also updates i18next + storage immediately for instant effect.
  async function updateLanguage(
    userId: string,
    language: 'en' | 'id'
  ): Promise<Profile> {
    const { data, error } = await db
      .from('profiles')
      .update({ language })
      .eq('id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async function updatePassword(password: string) {
    return db.auth.updateUser({ password });
  }

  // Deleting an auth user requires the service role, so it runs in the
  // delete-account Edge Function. On success the local session is cleared.
  async function deleteAccount() {
    const { error } = await db.functions.invoke('delete-account');
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
    await db.auth.signOut();
  }

  return {
    signInWithPassword,
    signUpWithPassword,
    resendConfirmation,
    requestPasswordReset,
    getProfile,
    upsertProfile,
    updateProfile,
    updateLanguage,
    updatePassword,
    deleteAccount,
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
