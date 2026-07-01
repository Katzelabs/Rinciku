import * as Linking from 'expo-linking';
import { createAuthApi } from '@rinciku/domain/auth';

import { supabase } from '@/lib/supabase';

// Shared data layer (@rinciku/domain) bound to the mobile Supabase client and
// native deep-link redirect targets. `Linking.createURL` yields the app's
// `rinciku://` scheme in dev-client/standalone builds (and an `exp://…/--/…`
// URL under Expo Go). Supabase appends `token_hash` + `type` to these for the
// email-confirmation and password-reset links — handled by the callback and
// reset-password routes.
const api = createAuthApi(supabase, {
  emailConfirm: () => Linking.createURL('/auth/callback'),
  passwordReset: () => Linking.createURL('/reset-password'),
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
