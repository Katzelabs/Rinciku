**Status:** done

## Goal

`/sign-up` route lets a new visitor create an account with email + password. On success the user lands on `/onboarding` (handled by the redirect chain in `foundation/03-route-guards.md`).

## Acceptance criteria

- [x] Zod schema `signUpSchema` in `src/features/auth/schemas.ts`: email (valid), password (min 8), confirm password (match).
- [x] `src/features/auth/pages/sign-up.tsx` renders a shadcn form (using the `Field` primitive + react-hook-form `Controller`) with the schema via `@hookform/resolvers/zod`.
- [x] Submit calls `supabase.auth.signUp({ email, password })` (via `signUpWithPassword` in `src/features/auth/api.ts`); surfaces Supabase errors via `toast.error(...)`.
- [x] On success: `toast.success(...)` and navigate to `/onboarding` (the auth provider session listener triggers the redirect; the page doesn't need to push).
- [x] Route added to `guestRoutes` in `src/features/auth/routes.tsx`, wrapped in `<RequireGuest>`.
- [x] Link at the bottom of the page: "Already have an account? Sign in" → `/sign-in`.
- [x] File layout matches project convention (schema in `schemas.ts`, form in `components/`, page in `pages/`, supabase call isolated to `api.ts`).

## Notes

- 2026-05-31 — Pivoted from the legacy shadcn `Form` primitive to the newer `Field`/`FieldGroup` primitive (already installed at `src/components/ui/field.tsx`). The `radix-rhea` style's `form` registry entry is empty, and the `shadcn` skill's current guidance is to use `Field` + `Controller`. The `new-form` project skill should be updated to reflect this.
- Route export in `routes.tsx` is `guestRoutes` (split during the route-guards task), not `authRoutes` — acceptance criterion was updated to match.
- Redirect chain on signup success: Supabase sets the session → `AuthProvider.onAuthStateChange` updates context → `<RequireGuest>` navigates to `/` → `requireOnboardedLoader` sees `profile.onboarded_at` is null → `redirect('/onboarding')`. The page never calls `navigate(...)`.
- Email-confirmation path: if Supabase returns `data.user` with `data.session === null` (autoconfirm disabled), the page shows a `toast.info(...)` asking the user to check their email; no redirect happens until they confirm.
- `pnpm build` and `pnpm lint` both clean.
