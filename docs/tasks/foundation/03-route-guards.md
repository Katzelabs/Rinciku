**Status:** done

## Goal

Centralize the "is the user signed in / is onboarding complete" routing logic so feature route arrays don't each re-implement redirects. Unauthenticated users hitting protected routes go to `/sign-in`; authenticated users hitting auth routes go to `/`; users with incomplete profiles go to `/onboarding`.

## Acceptance criteria

- [x] `src/features/auth/components/require-auth.tsx` exports a wrapper that reads `useAuth`, shows a loading state while `loading === true`, redirects to `/sign-in` when no session, and renders children otherwise.
- [x] `src/features/auth/components/require-guest.tsx` exports the inverse — redirects authenticated users away from `/sign-in` and `/sign-up` to `/`.
- [x] `src/features/auth/components/require-onboarded.tsx` redirects authenticated-but-not-onboarded users to `/onboarding` (used together with `require-auth`).
- [x] Authenticated feature `routes.tsx` files wrap their `element` in `<RequireAuth><RequireOnboarded>…</RequireOnboarded></RequireAuth>` (or compose via a small helper).
- [x] `auth/routes.tsx` wraps sign-in / sign-up in `<RequireGuest>`; `/onboarding` uses only `<RequireAuth>` (not `RequireOnboarded`, since that's the point of the page).
- [x] Re-export the wrappers from `src/features/auth/index.ts`.

## Notes

- 2026-05-30 — "Onboarded" sentinel: per `docs/schema.md` §3 the four income/currency/cycle columns are all NOT NULL with defaults, so a "non-null" check is meaningless. Added migration `20260530090125_profiles_onboarded_at.sql` introducing a nullable `profiles.onboarded_at timestamptz`. `<RequireOnboarded>` redirects while it's null; the onboarding form (auth/03) will set it to `now()` on submit.
- 2026-05-30 — `AuthProvider` now owns profile fetching in addition to session. `useAuth()` exposes `{ session, user, profile, loading }`; `loading` stays `true` until both the session check and the profile fetch (when there is a session) settle. This avoids a flicker where guards would decide based on `profile == null` before the fetch returned.
- 2026-05-30 — Composition helper: `protectedRoute(element)` wraps an element in `<RequireAuth><RequireOnboarded>…</RequireOnboarded></RequireAuth>`. Feature `routes.tsx` files import it from `@/features/auth` instead of nesting two components by hand. Empty stubs (`budgets`, `ai-chat`) were left as-is; they'll adopt the helper when their first route lands.
- 2026-05-30 — `RequireAuth` stashes the attempted `pathname + search` on `location.state.redirectTo` so `RequireGuest` can bounce the user back after sign-in. The future sign-in form should also consult `location.state?.redirectTo` for its post-submit navigation.
- 2026-05-31 — Added react-router `loader` guards alongside the component guards to fix the "shell paints before redirect" flash on hard reload. New file `src/features/auth/loaders.ts` exports `requireAuthLoader`, `requireOnboardedLoader`, `requireGuestLoader`. `src/app/router.tsx` was restructured so each child of the root route sits under its loader (guest routes / onboarding / `AppShell`+protected). Component guards stay as belt-and-suspenders for in-tree session changes (e.g. sign-out from a page) — loaders only run on navigation, not on context updates.
- 2026-05-31 — Loader redirects use `/sign-in?redirectTo=…` (query param) rather than `location.state.redirectTo`, because react-router's `redirect()` helper returns a `Response` and can't carry navigation state. The query-param target is validated against open-redirects (must start with `/`, not `//`). The sign-in form should prefer `location.state.redirectTo` (component-guard path) and fall back to the `redirectTo` query param (loader path).
- 2026-05-31 — Renamed `authRoutes` to `guestRoutes` and split out `onboardingRoutes` in `auth/routes.tsx` so each can sit under the correct loader in the router tree. Both arrays are still empty (the actual pages land in auth tasks 02/03).
