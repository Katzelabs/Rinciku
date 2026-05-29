---
name: supabase-setup
description: One-shot wiring for Rinciku's Supabase integration — typed browser client at src/lib/supabase.ts, env var template, generated database types, and an auth provider added to src/app/providers.tsx. Run once at the start of the project; becomes inert once wiring exists.
---

# supabase-setup

## When to use

- The user asks to "wire up supabase", "set up auth", or "initialize the supabase client".
- `src/lib/supabase.ts` does not yet exist.
- Before any feature's `api.ts` can be implemented (it depends on the shared client and generated types).
- If `src/lib/supabase.ts` already exists, **stop and report** — this is a one-shot skill; further changes should be targeted edits, not a re-run.

## Steps

1. **Install dependencies** (if not already in `package.json`):
   ```bash
   pnpm add @supabase/supabase-js @supabase/ssr
   ```
   We use `@supabase/ssr`'s `createBrowserClient` even in a pure SPA — it handles cookie-backed sessions and is forward-compatible if we ever add SSR.
2. **Create `.env.example`** at the repo root (and `.env.local` for actual values — git-ignored):
   ```
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=<paste from `supabase start` output>
   ```
   Confirm `.env.local` is in `.gitignore`.
3. **Create the typed client** at `src/lib/supabase.ts`:
   ```ts
   import { createBrowserClient } from '@supabase/ssr';
   import type { Database } from './database.types';

   const url = import.meta.env.VITE_SUPABASE_URL;
   const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   if (!url || !anonKey) {
     throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
   }

   export const supabase = createBrowserClient<Database>(url, anonKey);
   ```
4. **Generate types** from the local Supabase instance:
   ```bash
   supabase start                                                  # if not running
   supabase gen types typescript --local > src/lib/database.types.ts
   ```
   If there are no migrations yet, this will produce a near-empty `Database` type — that's fine, it'll grow as `new-migration` adds tables.
5. **Add an auth provider** to `src/app/providers.tsx`:
   - Create `src/features/auth/hooks/use-auth.ts` with a `useAuth()` hook backed by `supabase.auth.getSession()` + `supabase.auth.onAuthStateChange()`.
   - Wrap the existing `Providers` passthrough with `<AuthProvider>` that exposes `{ session, user, loading }` via context.
   - Re-export `useAuth` and `AuthProvider` from `src/features/auth/index.ts`.
6. **Augment Vite env types** at `src/vite-env.d.ts` (or create `src/env.d.ts`):
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

- The shared client is imported as `import { supabase } from '@/lib/supabase'` everywhere. Never call `createBrowserClient` outside this file.
- `database.types.ts` is generated, not hand-edited. Regenerate after every `new-migration` run.
- Env vars MUST be prefixed `VITE_` to be exposed to the client bundle. The anon key is safe in the browser; the service role key is **not** and must never appear in any `VITE_*` var.
- Auth context lives in the `auth` feature, exposed via `useAuth()` — components don't call `supabase.auth.*` directly.
- This skill is one-shot. Once `src/lib/supabase.ts` exists, refuse to re-run; instead make a targeted edit.

## Verification

- `src/lib/supabase.ts`, `src/lib/database.types.ts`, `.env.example`, and the env type augmentation all exist.
- `pnpm build` succeeds.
- `pnpm dev` boots without a "Missing VITE_SUPABASE_*" error (with `.env.local` populated).
- In the browser console: `await supabase.auth.getSession()` returns `{ data: { session: null }, error: null }` for an unauthenticated visitor — confirms the client is reachable.
