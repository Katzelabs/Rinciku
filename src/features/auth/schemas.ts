import { z } from 'zod';
import type { TFunction } from 'i18next';

import { CURRENCY_CODES } from '@/lib/fx';

export function makeSignInSchema(t: TFunction) {
  return z.object({
    email: z.string().email(t('errors.emailInvalid')),
    password: z.string().min(1, t('errors.passwordRequired')),
  });
}

export type SignInInput = z.infer<ReturnType<typeof makeSignInSchema>>;

// Single source of truth — drives both the resolver and the on-screen checklist.
// Keep in sync with supabase/config.toml `password_requirements`.
// `labelKey` is an i18n key (auth namespace) so both the resolver messages and
// the checklist UI render the same translated label.
export const passwordPolicy = [
  {
    id: 'length',
    labelKey: 'passwordRules.length',
    test: (v: string) => v.length >= 8,
  },
  {
    id: 'upper',
    labelKey: 'passwordRules.upper',
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: 'lower',
    labelKey: 'passwordRules.lower',
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    id: 'digit',
    labelKey: 'passwordRules.digit',
    test: (v: string) => /\d/.test(v),
  },
] as const;

function makePasswordField(t: TFunction) {
  return z.string().superRefine((value, ctx) => {
    if (value.length === 0) {
      ctx.addIssue({ code: 'custom', message: t('errors.passwordRequired') });
      return;
    }
    for (const rule of passwordPolicy) {
      if (!rule.test(value)) {
        ctx.addIssue({ code: 'custom', message: t(rule.labelKey) });
      }
    }
  });
}

export function makeSignUpSchema(t: TFunction) {
  return z
    .object({
      email: z.string().trim().toLowerCase().email(t('errors.emailInvalid')),
      password: makePasswordField(t),
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t('errors.passwordsMismatch'),
      path: ['confirmPassword'],
    });
}

export type SignUpInput = z.infer<ReturnType<typeof makeSignUpSchema>>;

export function makeChangePasswordSchema(t: TFunction) {
  return z
    .object({
      password: makePasswordField(t),
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t('errors.passwordsMismatch'),
      path: ['confirmPassword'],
    });
}

export type ChangePasswordInput = z.infer<
  ReturnType<typeof makeChangePasswordSchema>
>;

export function makeForgotPasswordSchema(t: TFunction) {
  return z.object({
    email: z.string().trim().toLowerCase().email(t('errors.emailInvalid')),
  });
}

export type ForgotPasswordInput = z.infer<
  ReturnType<typeof makeForgotPasswordSchema>
>;

// Setting a new password via the recovery link is the same shape as changing
// it from settings (new password + confirmation, same policy).
export const makeResetPasswordSchema = makeChangePasswordSchema;

export type ResetPasswordInput = ChangePasswordInput;

export function makeOnboardingSchema(t: TFunction) {
  return z.object({
    display_name: z
      .string()
      .trim()
      .min(1, t('errors.displayNameRequired'))
      .max(80, t('errors.displayNameMax')),
    base_currency: z.enum(CURRENCY_CODES, {
      message: t('errors.currencyRequired'),
    }),
    expected_monthly_income: z
      .number({ message: t('errors.incomeNumber') })
      .nonnegative(t('errors.incomeNonnegative')),
    month_start_day: z
      .number({ message: t('errors.dayNumber') })
      .int(t('errors.dayInteger'))
      .min(1, t('errors.dayRange'))
      .max(28, t('errors.dayRange')),
  });
}

export type OnboardingInput = z.infer<ReturnType<typeof makeOnboardingSchema>>;
