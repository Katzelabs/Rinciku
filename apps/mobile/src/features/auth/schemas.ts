// Zod schema factories + password policy live in @rinciku/domain (shared with
// web). Re-exported so screens can import them from the feature.
export {
  makeSignInSchema,
  makeSignUpSchema,
  makeChangePasswordSchema,
  makeForgotPasswordSchema,
  makeResetPasswordSchema,
  makeOnboardingSchema,
  passwordPolicy,
} from '@rinciku/domain/auth';

export type {
  SignInInput,
  SignUpInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  OnboardingInput,
} from '@rinciku/domain/auth';
