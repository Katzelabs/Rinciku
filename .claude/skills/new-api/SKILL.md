---
name: new-api
description: Populate or extend a Rinciku feature's api.ts with Supabase-backed queries and mutations. Imports the shared client from @/lib/supabase, returns typed rows from database.types.ts, surfaces PostgrestError, and keeps the file free of business logic.
---

# new-api

## When to use

- The user asks to add a query/mutation/CRUD function to a feature (e.g. "add listExpenses", "let me create a budget").
- A loader/action/hook needs a new data-access function in the feature's `api.ts`.
- Do **not** put data fetching inside components, loaders, actions, or hooks directly — it belongs in `api.ts`.

## Pre-requisite

- `src/lib/supabase.ts` and `src/lib/database.types.ts` must exist. If not, run `supabase-setup` first.

## Steps

1. Identify the target feature: `src/features/<feature>/api.ts`.
2. Import the shared Supabase client and types:
   ```ts
   import { supabase } from '@/lib/supabase';
   import type { Database } from '@/lib/database.types';

   type <Row> = Database['public']['Tables']['<table>']['Row'];
   type <Insert> = Database['public']['Tables']['<table>']['Insert'];
   type <Update> = Database['public']['Tables']['<table>']['Update'];
   ```
3. Write each function as a small async wrapper around a single Supabase call:
   ```ts
   export async function list<Things>(): Promise<<Row>[]> {
     const { data, error } = await supabase.from('<table>').select('*').order('created_at', { ascending: false });
     if (error) throw error;
     return data;
   }

   export async function create<Thing>(input: <Insert>): Promise<<Row>> {
     const { data, error } = await supabase.from('<table>').insert(input).select().single();
     if (error) throw error;
     return data;
   }
   ```
4. Always destructure `{ data, error }` and throw `error` so callers can rely on a single failure path (`try/catch` or react-router's error boundary).
5. Run `pnpm build` to catch type drift between the schema and the function signatures.

## Conventions to enforce

- `api.ts` is the **only** place that touches `supabase.from(...)` for a feature.
- Pure data layer: no formatting, no business rules, no Zod validation, no toast notifications. Those belong in `actions.ts`, `hooks/`, or the page.
- Use the generated `Database` types — never type rows manually.
- Throw on error; never swallow or `return null` on failure.
- One function per logical operation. Don't bundle (e.g. `getAllAndCount` is two functions).
- Filter by `user_id` only when the table lacks an RLS owner policy. With RLS in place, `auth.uid()` constrains rows automatically — adding redundant `.eq('user_id', uid)` is fine for clarity but not required.
- Use minor units (cents / rupiah-sen) for currency columns; types reflect that with `number` (integer).

## Verification

- `pnpm build` succeeds — type errors here usually mean `database.types.ts` is stale; regenerate via `supabase gen types typescript --local > src/lib/database.types.ts`.
- Call the new function from a loader/action/hook and exercise the flow in `pnpm dev`.
- Confirm RLS works: log in as a different user and verify the row isn't returned.
