**Status:** done

## Goal

After first sign-up, capture the per-user fields the rest of the app needs from `profiles`: display name, monthly income in IDR + USD, base currency, and the day of the month the budget cycle starts on. Users with an incomplete profile are forced through this page before any other authenticated route.

Reference: `docs/schema.md` §3 `profiles`.

## Acceptance criteria

- [x] Zod schema `onboardingSchema` in `src/features/auth/schemas.ts`: `display_name` (non-empty, ≤80), `base_currency` (`'IDR' | 'USD'`), `monthly_income_idr` / `monthly_income_usd` (number ≥ 0), `month_start_day` (int 1–28).
- [x] `src/features/auth/pages/onboarding.tsx` renders the form (wrapped in a `Card`) using the `Field`/`FieldLabel`/`FieldError` layout from `src/components/ui/field.tsx`, with shadcn `Select` for the currency and `Input` for everything else. Form logic lives in `src/features/auth/components/onboarding-form.tsx` (RHF + zodResolver, mirrors `sign-up-form.tsx`).
- [x] Submit calls `upsertProfile(userId, values)` in `api.ts`, which `supabase.from('profiles').upsert(..., { onConflict: 'id' })` keyed on `auth.uid()` and stamps `onboarded_at = now()`.
- [x] `api.ts` also exposes `getProfile(userId)` returning the row.
- [x] "Profile complete" is defined as `profile.onboarded_at IS NOT NULL` — already read by `<RequireOnboarded>` and `requireOnboardedLoader`. The four data fields are `NOT NULL DEFAULT ...` in the schema, so a dedicated completion sentinel is required.
- [x] Route `/onboarding` added to `onboardingRoutes`, wrapped in `<RequireAuth>`. It's mounted under `requireAuthLoader` (not `requireOnboardedLoader`) in `src/app/router.tsx`.
- [x] On success: `refreshProfile()` (new method on `AuthContext`) is awaited so the in-memory `useAuth().profile` reflects the new `onboarded_at`, then `navigate('/', { replace: true })`.

## Notes

- 2026-05-31 — Reconciliations with the original spec:
  - Field name `cycle_start_day` → `month_start_day` (matches `docs/schema.md` and `supabase/schemas/10_profiles.sql`; 1–28 check).
  - "All four fields non-null" replaced with `onboarded_at`-based completion check, since the four columns are `NOT NULL DEFAULT` in the schema and can never be null.
  - shadcn `Form` not added; the repo already uses the custom `Field` layout system (see `sign-up-form.tsx`). RHF wires up via `Controller` per field.
  - Added `display_name` to the form (schema has it as nullable text; better to capture during onboarding than via a future settings page).
  - `AuthContextValue` gained `refreshProfile()` so callers can force the cached profile to reload after mutations. Implemented in `auth-provider.tsx` via a shared `loadProfile` callback.
  - Numeric inputs convert empty string → `undefined` and otherwise `Number(value)` in the Controller's `onChange`, so `field.value` stays typed as `number` and Zod's `z.number()` validation reports a clean error for empty fields. Avoids the input/output type mismatch that `z.coerce.number()` introduces with RHF in Zod 4.
