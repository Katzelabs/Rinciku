import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;

// Single source of truth — drives both the resolver and the on-screen checklist.
// Keep in sync with supabase/config.toml `password_requirements`.
export const passwordPolicy = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (v: string) => v.length >= 8,
  },
  {
    id: 'upper',
    label: 'An uppercase letter (A–Z)',
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: 'lower',
    label: 'A lowercase letter (a–z)',
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    id: 'digit',
    label: 'A number (0–9)',
    test: (v: string) => /\d/.test(v),
  },
] as const;

const passwordField = z.string().superRefine((value, ctx) => {
  if (value.length === 0) {
    ctx.addIssue({ code: 'custom', message: 'Password is required' });
    return;
  }
  for (const rule of passwordPolicy) {
    if (!rule.test(value)) {
      ctx.addIssue({ code: 'custom', message: rule.label });
    }
  }
});

export const signUpSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const onboardingSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(80, 'Keep it under 80 characters'),
  base_currency: z.enum(['IDR', 'USD'], {
    message: 'Choose IDR or USD',
  }),
  monthly_income_idr: z
    .number({ message: 'Enter a number' })
    .nonnegative('Must be 0 or greater'),
  monthly_income_usd: z
    .number({ message: 'Enter a number' })
    .nonnegative('Must be 0 or greater'),
  month_start_day: z
    .number({ message: 'Enter a number' })
    .int('Must be a whole number')
    .min(1, 'Must be between 1 and 28')
    .max(28, 'Must be between 1 and 28'),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
