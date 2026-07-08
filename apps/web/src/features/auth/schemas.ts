// Schemas live in @rinciku/domain (shared with mobile); re-exported here so
// existing call sites (`import { makeSignInSchema } from '../schemas'`) keep working.
export {
  makeSignInSchema,
  makeSignUpSchema,
  makeChangePasswordSchema,
  makeForgotPasswordSchema,
  makeResetPasswordSchema,
  makeOnboardingSchema,
  passwordPolicy,
  APP_LANGUAGES,
  type AppLanguage,
  type SignInInput,
  type SignUpInput,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type OnboardingInput,
} from '@rinciku/domain/auth';
