---
name: new-api
description: Add a Supabase-backed query/mutation to a Rinciku feature. The data layer lives in @rinciku/domain as a create<Feature>Api(db) factory (portable, shared by web + mobile); each app's features/<feature>/api.ts is a thin shim that binds the factory to its own Supabase client. Returns typed rows from the generated Database types and throws PostgrestError.
---

# new-api

## When to use

- The user asks to add a query/mutation/CRUD function to a feature (e.g. "add listExpenses", "let me create a budget").
- A loader/action/hook/screen needs a new data-access function.
- Do **not** put data fetching inside components, loaders, actions, hooks, or screens directly — it belongs in the domain factory.

## Where the code goes (read first)

Data access is **portable and shared** between web and mobile. It lives in `@rinciku/domain`, NOT in an app:

- **`packages/domain/src/features/<feature>/api.ts`** — the real logic: `export function create<Feature>Api(db, deps?)` returning the query/mutation functions. The Supabase client is **dependency-injected** (`db: TypedSupabaseClient`), never imported, so the same code runs on both platforms.
- **`apps/web/src/features/<feature>/api.ts`** and **`apps/mobile/src/features/<feature>/api.ts`** — thin shims that call `create<Feature>Api(supabase, ...)` with that app's client and re-export the bound functions.

If the feature isn't in `@rinciku/domain` yet, create the folder there (`api.ts` + `index.ts`, plus `schemas.ts`/`types.ts` as needed) and add an `exports` entry `"./<feature>": "./src/features/<feature>/index.ts"` to `packages/domain/package.json`.

## Pre-requisite

- `packages/db/src/database.types.ts` must exist and be current. If not, run `pnpm gen:types`.
- Each app's `src/lib/supabase.ts` must exist (web: `createSupabaseClient`; mobile: `createMobileClient`). If web's is missing, run `supabase-setup`.

## Steps

1. **Open the domain factory** at `packages/domain/src/features/<feature>/api.ts`. Import types from `@rinciku/db`:
   ```ts
   import type { TypedSupabaseClient, Database } from '@rinciku/db';

   type <Row> = Database['public']['Tables']['<table>']['Row'];
   type <Insert> = Database['public']['Tables']['<table>']['Insert'];
   type <Update> = Database['public']['Tables']['<table>']['Update'];
   ```
2. **Add the function inside `create<Feature>Api`**, closing over the injected `db`:
   ```ts
   export function create<Feature>Api(db: TypedSupabaseClient) {
     async function list<Things>(): Promise<<Row>[]> {
       const { data, error } = await db
         .from('<table>')
         .select('*')
         .order('created_at', { ascending: false });
       if (error) throw error;
       return data;
     }

     async function create<Thing>(input: <Insert>): Promise<<Row>> {
       const { data, error } = await db.from('<table>').insert(input).select().single();
       if (error) throw error;
       return data;
     }

     return { list<Things>, create<Thing> /* , ... */ };
   }
   ```
   - If the operation needs a platform-specific value (e.g. a redirect URL), add it to a `deps` parameter and inject it from each app's shim — don't reach for `window`, `import.meta`, or `process.env` inside `packages/domain`. (See `createAuthApi(db, redirects)` for the pattern.)
3. **Re-export from the app shims** so callers get the bound functions. Each app's `features/<feature>/api.ts`:
   ```ts
   import { create<Feature>Api } from '@rinciku/domain/<feature>';
   import { supabase } from '@/lib/supabase';

   export const { list<Things>, create<Thing> } = create<Feature>Api(supabase);
   ```
   Web and mobile shims are near-identical — only the imported `supabase` client (and any injected `deps`) differ.
4. **Typecheck** the domain package and the consuming app(s):
   ```bash
   pnpm --filter @rinciku/domain typecheck
   pnpm build                              # web (tsc + vite)
   pnpm --filter @rinciku/mobile typecheck
   ```

## Conventions to enforce

- **The domain factory is the only place that calls `db.from(...)`** for a feature. App `api.ts` files only bind and re-export — never add a raw `supabase.from(...)` call there.
- **Inject, don't import.** `packages/domain` must stay free of `window`/DOM, `import.meta`, `process.env`, AsyncStorage, and any web- or RN-only API. Platform values come in through the factory's arguments.
- Pure data layer: no formatting, no business rules, no toasts. Zod *parsing* can live in the domain function if it guards the input shape; UI-side validation stays with the form.
- Use the generated `Database` types — never type rows by hand.
- Throw on error; never swallow or `return null` on failure. One function per logical operation.
- Filter by `user_id` only when the table lacks an RLS owner policy — with RLS, `auth.uid()` already constrains rows. Redundant `.eq('user_id', uid)` is allowed for clarity but not required.
- Currency columns are **minor units** (`bigint` → `number` in TS): sen for IDR, cents for USD.

## Verification

- `pnpm --filter @rinciku/domain typecheck` is clean — type errors usually mean `database.types.ts` is stale; regenerate via `pnpm gen:types`.
- `pnpm build` (web) and `pnpm --filter @rinciku/mobile typecheck` both pass — confirms both shims still bind cleanly.
- Exercise the flow from a loader/action/hook (web) or screen/hook (mobile).
- Confirm RLS: sign in as a different user and verify the row isn't returned.
