**Status:** not-started

## Goal

`/sign-up` route lets a new visitor create an account with email + password. On success the user lands on `/onboarding` (handled by the redirect chain in `foundation/03-route-guards.md`).

## Acceptance criteria

- [ ] Zod schema `signUpSchema` in `src/features/auth/schemas.ts`: email (valid), password (min 8), confirm password (match).
- [ ] `src/features/auth/pages/sign-up.tsx` renders a shadcn `Form` with the schema via `@hookform/resolvers/zod`.
- [ ] Submit calls `supabase.auth.signUp({ email, password })`; surfaces Supabase errors via `toast.error(...)`.
- [ ] On success: `toast.success(...)` and navigate to `/onboarding` (the auth provider session listener triggers the redirect; the page doesn't need to push).
- [ ] Route added to `authRoutes` in `src/features/auth/routes.tsx`, wrapped in `<RequireGuest>` once that wrapper exists.
- [ ] Link at the bottom of the page: "Already have an account? Sign in" → `/sign-in`.
- [ ] Built via the `new-form` skill so the file layout matches project convention.

## Notes
