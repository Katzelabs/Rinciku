**Status:** not-started

## Goal

`/account` page lets a signed-in user update the same fields captured during onboarding, and sign out. Sign-out is also reachable from the topbar account menu.

## Acceptance criteria

- [ ] `src/features/auth/pages/account.tsx` reuses the onboarding form (extract into `src/features/auth/components/profile-form.tsx` if not already) prefilled with the current profile.
- [ ] Submit calls the same `upsertProfile(...)` API; success toast on completion.
- [ ] Topbar account menu (a shadcn `DropdownMenu` mounted from `AppShell`) shows the user email, a "Settings" link to `/account`, and a "Sign out" item.
- [ ] Sign-out calls `supabase.auth.signOut()`, then navigates to `/sign-in`. The auth provider's `onAuthStateChange` clears the session naturally.
- [ ] Route `/account` added to a feature route array wrapped in `<RequireAuth><RequireOnboarded>` — put it in `authRoutes` to keep all auth-adjacent routes co-located.

## Notes
