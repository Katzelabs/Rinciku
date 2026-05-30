**Status:** not-started

## Goal

After first sign-up, capture the per-user fields the rest of the app needs from `profiles`: monthly income in IDR + USD, base currency, and the day of the month the budget cycle starts on. Users with an incomplete profile are forced through this page before any other authenticated route.

Reference: `docs/schema.md` §3 `profiles`.

## Acceptance criteria

- [ ] Zod schema `onboardingSchema` in `src/features/auth/schemas.ts`: `income_idr` (numeric ≥ 0), `income_usd` (numeric ≥ 0), `base_currency` ('IDR' | 'USD'), `cycle_start_day` (int 1–28).
- [ ] `src/features/auth/pages/onboarding.tsx` renders the form using shadcn `Form` + `Select` (currency) + `Input` (numbers).
- [ ] Submit upserts the row into `public.profiles` keyed on the current `auth.uid()` via `api.ts`'s `upsertProfile(...)` function.
- [ ] `api.ts` also exposes `getProfile()` returning the row (used by the onboarding guard to decide whether to redirect).
- [ ] "Profile complete" is defined as: row exists AND all four fields are non-null. The guard `<RequireOnboarded>` reads this.
- [ ] Route `/onboarding` added to `authRoutes` wrapped in `<RequireAuth>` only (not `<RequireOnboarded>`).
- [ ] On success: navigate to `/`.

## Notes
