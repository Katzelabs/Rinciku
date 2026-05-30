**Status:** not-started

## Goal

Centralize the "is the user signed in / is onboarding complete" routing logic so feature route arrays don't each re-implement redirects. Unauthenticated users hitting protected routes go to `/sign-in`; authenticated users hitting auth routes go to `/`; users with incomplete profiles go to `/onboarding`.

## Acceptance criteria

- [ ] `src/features/auth/components/require-auth.tsx` exports a wrapper that reads `useAuth`, shows a loading state while `loading === true`, redirects to `/sign-in` when no session, and renders children otherwise.
- [ ] `src/features/auth/components/require-guest.tsx` exports the inverse — redirects authenticated users away from `/sign-in` and `/sign-up` to `/`.
- [ ] `src/features/auth/components/require-onboarded.tsx` redirects authenticated-but-not-onboarded users to `/onboarding` (used together with `require-auth`).
- [ ] Authenticated feature `routes.tsx` files wrap their `element` in `<RequireAuth><RequireOnboarded>…</RequireOnboarded></RequireAuth>` (or compose via a small helper).
- [ ] `auth/routes.tsx` wraps sign-in / sign-up in `<RequireGuest>`; `/onboarding` uses only `<RequireAuth>` (not `RequireOnboarded`, since that's the point of the page).
- [ ] Re-export the wrappers from `src/features/auth/index.ts`.

## Notes
