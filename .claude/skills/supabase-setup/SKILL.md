---
name: supabase-setup
description: One-shot wiring for Rinciku's Supabase integration — typed browser client at apps/web/src/lib/supabase.ts, env var template, generated database types, and an auth provider added to apps/web/src/app/providers.tsx. Run once at the start of the project; becomes inert once wiring exists.
---

# supabase-setup

## When to use

- The user asks to "wire up supabase", "set up auth", or "initialize the supabase client".
- `apps/web/src/lib/supabase.ts` does not yet exist.
- Before any feature's `api.ts` can be implemented (it depends on the shared client and generated types).
- If `apps/web/src/lib/supabase.ts` already exists, **stop and report** — this is a one-shot skill; further changes should be targeted edits, not a re-run.
- **Web only.** The mobile app (`apps/mobile`) has its own client at `apps/mobile/src/lib/supabase.ts` using `createMobileClient(url, anonKey, AsyncStorage)` from `@rinciku/db` (env `EXPO_PUBLIC_SUPABASE_*`) and its own `AuthProvider`. It is already wired — don't run this skill for mobile.

## Steps

1. **Install dependencies** (if not already in `package.json`):
   ```bash
   pnpm add @supabase/supabase-js @supabase/ssr
   ```
   The `@rinciku/db` package's `createSupabaseClient` factory uses `@supabase/ssr`'s `createBrowserClient` under the hood even in a pure SPA — it handles cookie-backed sessions and is forward-compatible if we ever add SSR.
2. **Create `.env.example`** at the repo root (and `.env.local` for actual values — git-ignored):
   ```
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=<paste from `supabase start` output>
   ```
   Confirm `.env.local` is in `.gitignore`.
3. **Create the typed client** (a thin wrapper over `@rinciku/db`'s `createSupabaseClient`) at `apps/web/src/lib/supabase.ts`:
   ```ts
   import { createSupabaseClient } from '@rinciku/db';

   const url = import.meta.env.VITE_SUPABASE_URL;
   const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   if (!url || !anonKey) {
     throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
   }

   export const supabase = createSupabaseClient(url, anonKey);
   ```
4. **Generate types** from the local Supabase instance:
   ```bash
   supabase start                                                  # if not running
   supabase gen types typescript --local > packages/db/src/database.types.ts
   ```
   (Or run `pnpm gen:types` from the repo root, which does exactly this.) If there are no migrations yet, this will produce a near-empty `Database` type — that's fine, it'll grow as `new-migration` adds tables.
5. **Add an auth provider** to `apps/web/src/app/providers.tsx`:
   - Create `apps/web/src/features/auth/hooks/use-auth.ts` with a `useAuth()` hook backed by `supabase.auth.getSession()` + `supabase.auth.onAuthStateChange()`.
   - Wrap the existing `Providers` passthrough with `<AuthProvider>` that exposes `{ session, user, loading }` via context.
   - Re-export `useAuth` and `AuthProvider` from `apps/web/src/features/auth/index.ts`.
6. **Augment Vite env types** at `apps/web/src/vite-env.d.ts` (or create `apps/web/src/env.d.ts`):
   ```ts
   /// <reference types="vite/client" />
   interface ImportMetaEnv {
     readonly VITE_SUPABASE_URL: string;
     readonly VITE_SUPABASE_ANON_KEY: string;
   }
   interface ImportMeta {
     readonly env: ImportMetaEnv;
   }
   ```
7. Run `pnpm build` to confirm everything types.

## Conventions to enforce

- The shared client is imported as `import { supabase } from '@/lib/supabase'` everywhere. Never call `createSupabaseClient` outside this file.
- `database.types.ts` is generated, not hand-edited. Regenerate after every `new-migration` run.
- Env vars MUST be prefixed `VITE_` to be exposed to the client bundle. The anon key is safe in the browser; the service role key is **not** and must never appear in any `VITE_*` var.
- Auth context lives in the `auth` feature, exposed via `useAuth()` — components don't call `supabase.auth.*` directly.
- This skill is one-shot. Once `apps/web/src/lib/supabase.ts` exists, refuse to re-run; instead make a targeted edit.

## Verification

- `apps/web/src/lib/supabase.ts`, `packages/db/src/database.types.ts`, `.env.example`, and the env type augmentation all exist.
- `pnpm build` succeeds.
- `pnpm dev` boots without a "Missing VITE_SUPABASE_*" error (with `.env.local` populated).
- In the browser console: `await supabase.auth.getSession()` returns `{ data: { session: null }, error: null }` for an unauthenticated visitor — confirms the client is reachable.
