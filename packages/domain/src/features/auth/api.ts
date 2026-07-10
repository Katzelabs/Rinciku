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
  // `captchaToken` (Turnstile) is optional on every captcha-gated endpoint:
  // when [auth.captcha] is enabled on the Supabase project, signup / signin /
  // recover / resend all REQUIRE a token, and callers that render the widget
  // pass it here. Callers without a widget (mobile, or web without
  // VITE_TURNSTILE_SITE_KEY) pass nothing — fine while captcha is off.
  async function signInWithPassword(input: SignInInput, captchaToken?: string) {
    return db.auth.signInWithPassword({
      ...input,
      options: captchaToken ? { captchaToken } : undefined,
    });
  }

  // Email confirmation is enabled (supabase/config.toml), so signUp returns a
  // user with no session and sends a confirmation email. The link lands on the
  // injected emailConfirm target, which exchanges the code and routes onward.
  //
  // Email normalization (trim + lowercase) is handled by signUpSchema, so the
  // input reaching here is already normalized. Don't re-introduce raw form values.
  async function signUpWithPassword(
    input: {
      email: string;
      password: string;
    },
    captchaToken?: string
  ) {
    return db.auth.signUp({
      ...input,
      options: { emailRedirectTo: redirects.emailConfirm(), captchaToken },
    });
  }

  // Resend the signup confirmation email (e.g. the first one didn't arrive).
  // Rate-limited by Supabase (auth.email.max_frequency, rate_limit.email_sent).
  async function resendConfirmation(email: string, captchaToken?: string) {
    return db.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirects.emailConfirm(), captchaToken },
    });
  }

  // Send a password-reset email. The link lands on the injected passwordReset
  // target, where the recovery session is established and the user sets a new password.
  async function requestPasswordReset(email: string, captchaToken?: string) {
    return db.auth.resetPasswordForEmail(email, {
      redirectTo: redirects.passwordReset(),
      captchaToken,
    });
  }

  // Verify the 6-digit signup confirmation code ({{ .Token }} in the
  // confirmation email). This is the same token as the token_hash link, just
  // typed by hand — the mobile OTP path, since opening a web link would break
  // the native flow. `type: 'signup'` mirrors the link's `&type=signup`. On
  // success a full session is established and the root guard hands off to
  // onboarding.
  async function verifySignupOtp(email: string, token: string) {
    return db.auth.verifyOtp({ email, token, type: 'signup' });
  }

  // Verify the 6-digit password-recovery code ({{ .Token }} in the recovery
  // email). `type: 'recovery'` mirrors the link's `&type=recovery` and yields a
  // short-lived recovery session; the caller then updates the password.
  async function verifyRecoveryOtp(email: string, token: string) {
    return db.auth.verifyOtp({ email, token, type: 'recovery' });
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
    verifySignupOtp,
    verifyRecoveryOtp,
    getProfile,
    upsertProfile,
    updateProfile,
    updateLanguage,
    updatePassword,
    deleteAccount,
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
