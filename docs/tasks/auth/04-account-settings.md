**Status:** done

## Goal

`/account` page lets a signed-in user update the same fields captured during onboarding, and sign out. Sign-out is also reachable from the topbar account menu.

## Acceptance criteria

- [x] `src/features/auth/pages/account.tsx` reuses the onboarding form (renamed from `onboarding-form.tsx` to `src/features/auth/components/profile-form.tsx`, export `ProfileForm`) prefilled with the current profile.
- [x] Submit calls the same `upsertProfile(...)` API; success toast on completion.
- [x] Topbar account menu (a shadcn `DropdownMenu` mounted from `AppShell` via `src/components/shared/account-menu.tsx`) shows the user display name + email, a "Settings" link to `/account`, and a "Sign out" item.
- [x] Sign-out calls `supabase.auth.signOut()`, then navigates to `/sign-in` with `{ replace: true }`. The auth provider's `onAuthStateChange` clears the session naturally.
- [x] Route `/account` added to a new `authRoutes` array in `src/features/auth/routes.tsx` and spread into the AppShell children in `src/app/router.tsx`, so it inherits `requireOnboardedLoader` alongside the rest of the app (loader-based protection matches the existing convention; `<RequireAuth><RequireOnboarded>` wrapper components are not used at the route level here).

## Notes

- 2026-05-31 — Renamed `onboarding-form.tsx` → `profile-form.tsx`; export `OnboardingForm` → `ProfileForm`. Added `submitLabel` + `submittingLabel` props (defaults `'Save'` / `'Saving…'`). Onboarding page passes `submitLabel='Continue'` to preserve original copy.
- Account page stays on `/account` after submit (toast on success) instead of redirecting — settings-page UX vs. onboarding's one-time gate.
- `upsertProfile` is reused as-is, including the re-stamp of `onboarded_at = now()` on every save. Acceptable for now; flagged for follow-up if we want a separate "first onboarded at" semantic.
- AppTopbar lost its standalone email span; the email now lives inside the dropdown label alongside the display name. The `data-slot='account-menu'` placeholder was replaced with `<AccountMenu />`.
