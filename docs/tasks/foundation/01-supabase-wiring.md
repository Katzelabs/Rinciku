**Status:** done

## Goal

Stand up the Supabase client, environment configuration, generated DB types, and a minimal auth provider so every feature can read/write data and observe the current session. This is the prerequisite for every other task in the project.

## Acceptance criteria

- [x] `.env.example` documents `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; `.env.local` has real values for local dev.
- [x] Typed browser client at `src/lib/supabase.ts` using `createClient<Database>` with the env vars.
- [x] Generated `src/lib/database.types.ts` reflects `docs/schema.md` (regenerate after every migration).
- [x] `AuthProvider` in `src/features/auth/components/auth-provider.tsx` subscribes to `onAuthStateChange` and exposes session + user via context.
- [x] `useAuth` hook in `src/features/auth/hooks/use-auth.ts` returns `{ session, user, loading }`.
- [x] `src/app/providers.tsx` wraps the router children in `AuthProvider`.
- [x] `src/features/auth/index.ts` re-exports `AuthProvider`, `useAuth`, and `authRoutes`.

## Notes

- 2026-05-29 — Wired by the `supabase-setup` skill. Skill is now inert (its docstring says it becomes inert once wiring exists).
- Regenerate `database.types.ts` whenever a migration lands. The skill noted the command but did not pin it; add it here when a migration workflow is established.
- The provider is intentionally minimal — no profile loading, no role checks. Onboarding/profile completeness lives in `auth/03-profile-onboarding.md`.
