**Status:** not-started

## Goal

`/sign-in` route lets an existing user authenticate. Errors render inline; success lands the user on `/` (or `/onboarding` if their profile is incomplete — handled by the guard chain).

## Acceptance criteria

- [ ] Zod schema `signInSchema` in `src/features/auth/schemas.ts`: email (valid), password (non-empty).
- [ ] `src/features/auth/pages/sign-in.tsx` renders a shadcn `Form` against the schema.
- [ ] Submit calls `supabase.auth.signInWithPassword(...)`; on `AuthApiError` for invalid creds, show "Email or password is incorrect" as a form-level error (not a toast).
- [ ] On success: navigate to `/`; the auth provider + guards take over from there.
- [ ] Route added to `authRoutes` wrapped in `<RequireGuest>`.
- [ ] Link at the bottom: "Don't have an account? Sign up" → `/sign-up`.
- [ ] Built via the `new-form` skill.

## Notes
