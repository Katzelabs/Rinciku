import { createAuthApi } from '@rinciku/domain/auth';
import { supabase } from '@/lib/supabase';

// Data layer lives in @rinciku/domain (shared with mobile); this thin shim binds
// it to the web Supabase client + web redirect targets, and re-exports the named
// functions so existing call sites keep working.
const api = createAuthApi(supabase, {
  emailConfirm: () => `${window.location.origin}/auth/callback`,
  passwordReset: () => `${window.location.origin}/reset-password`,
});

export const {
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
} = api;

export type { AuthApi, AuthRedirects } from '@rinciku/domain/auth';
