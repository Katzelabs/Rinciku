---
name: new-feature
description: Scaffold a brand-new Rinciku feature across the monorepo — a portable slice in @rinciku/domain (data/schemas/types shared by web + mobile) plus the web feature folder under apps/web/src/features/ wired into the router, and optionally the mobile counterpart. Use when adding a top-level domain area (e.g. transfers, reports, notifications).
---

# new-feature

## When to use

- The user asks to "create a new feature", "scaffold a feature", or wants a top-level domain area that doesn't exist yet.
- The user mentions a domain (e.g. "transfers", "savings goals") that isn't already represented.
- Do **not** use this skill to add a page/screen inside an existing feature — use `new-page` (web) or `mobile-screen` (mobile) instead.

## Mental model

A feature spans up to three places (see `CLAUDE.md` → Shared domain layer / Feature-sliced / Mobile app):

1. **`packages/domain/src/features/<feature>/`** — the portable brain (data factory, Zod schemas, types). Shared by both apps. **Always create this** for any feature with data or validation.
2. **`apps/web/src/features/<feature>/`** — web slice (routes, pages, components, thin api shim).
3. **`apps/mobile/src/features/<feature>/`** — mobile slice (components, hooks, thin api shim; screens live under `apps/mobile/src/app/`). Create only if the user wants the feature on mobile now.

Ask which targets are in scope if unclear; default to **domain + web**.

## Steps

### 1. Domain slice (shared)

Create `packages/domain/src/features/<feature>/`:
```
api.ts        ← export function create<Feature>Api(db: TypedSupabaseClient, deps?) { return {}; }
schemas.ts    ← Zod schema factories (export const makeXSchema = (t) => z.object({...})) + inferred types
types.ts      ← row/domain types (often re-exported from @rinciku/db Database types)
index.ts      ← export * from './api'; export * from './schemas'; export * from './types';
```
Add the subpath to `packages/domain/package.json` `exports`:
```json
"./<feature>": "./src/features/<feature>/index.ts"
```
Mirror an existing slice (`auth`, `expenses`, `categories`) for shape. Leave bodies as minimal stubs — `new-api` / `new-form` fill them in.

### 2. Web slice

1. Confirm the feature name as kebab-case (e.g. `savings-goals`); camelCase the routes array: `savingsGoalsRoutes`.
2. Create `apps/web/src/features/<feature>/` with the full file set:
   ```
   actions.ts     api.ts        components/.gitkeep   hooks/.gitkeep
   index.ts       loaders.ts    pages/.gitkeep        routes.tsx
   schemas.ts     types.ts
   ```
   `api.ts`/`schemas.ts`/`types.ts` are **thin re-export shims** over `@rinciku/domain/<feature>` (see `apps/web/src/features/expenses/`), not fresh logic.
3. `routes.tsx` exports a typed `RouteObject[]`:
   ```tsx
   import type { RouteObject } from 'react-router';
   export const <feature>Routes: RouteObject[] = [];
   ```
4. `index.ts` re-exports at minimum the routes: `export { <feature>Routes } from './routes';`
5. Register in `apps/web/src/app/router.tsx`: add the import alphabetically, spread `...<feature>Routes` into `RootLayout`'s `children` before the `{ path: '*' }` wildcard.

### 3. Mobile slice (only if in scope)

Create `apps/mobile/src/features/<feature>/` with `api.ts` (binds `create<Feature>Api` to the mobile `supabase`), `schemas.ts`/`types.ts` re-exports, and `components/`/`hooks/` as needed. Screens are added separately with `mobile-screen` (they live under `apps/mobile/src/app/`, owned by expo-router). Mirror `apps/mobile/src/features/auth/`.

### 4. Verify

```bash
pnpm --filter @rinciku/domain typecheck
pnpm build                              # web
pnpm --filter @rinciku/mobile typecheck # if mobile slice created
```

## Conventions to enforce

- kebab-case folder names; camelCase web routes export (`<feature>Routes`).
- The **same `<feature>` slug** in all three places (domain export subpath, web folder, mobile folder).
- App `api.ts`/`schemas.ts`/`types.ts` are shims — real data/validation logic lives in `packages/domain` only. Keep `packages/domain` portable (no `window`, `import.meta`, `process.env`, RN/DOM APIs).
- Web imports across features use the `@/` alias; mobile uses `@/` for its own `src/`. Shared code is `@rinciku/<pkg>`.
- `index.ts` is the only public surface of each slice.
- Do **not** add routes/screens in this skill — leave those to `new-page` / `mobile-screen`.
- Do **not** invent files outside the canonical sets in `CLAUDE.md`.

## Verification

- The typecheck/build commands above succeed; `pnpm lint` is clean for the new files.
- `apps/web/src/app/router.tsx` has the spread in place.
- An empty `<feature>Routes` compiling is enough — actual pages come via `new-page`.
