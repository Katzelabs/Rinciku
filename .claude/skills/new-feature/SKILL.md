---
name: new-feature
description: Scaffold a new feature folder under apps/web/src/features/ for Rinciku following the feature-sliced layout, then register its routes in apps/web/src/app/router.tsx. Use when adding a brand-new domain area (e.g. transfers, reports, notifications).
---

# new-feature

## When to use

- The user asks to "create a new feature", "scaffold a feature", or wants to add a top-level domain area that doesn't fit any existing feature folder under `apps/web/src/features/`.
- The user mentions a domain (e.g. "transfers", "savings goals") that isn't already represented.
- Do **not** use this skill to add a page inside an existing feature — use `new-page` instead.

## Steps

1. Confirm the feature name with the user as kebab-case (e.g. `savings-goals`). Camel-case it for the routes array: `savingsGoalsRoutes`.
2. Create `apps/web/src/features/<feature>/` with the full file set:
   ```
   actions.ts     api.ts        components/.gitkeep   hooks/.gitkeep
   index.ts       loaders.ts    pages/.gitkeep        routes.tsx
   schemas.ts     types.ts
   ```
   Match the shape of an existing stub feature (e.g. `apps/web/src/features/auth/`) — placeholder files can stay empty exports until populated.
3. `routes.tsx` exports a typed `RouteObject[]`:
   ```tsx
   import type { RouteObject } from 'react-router';

   export const <feature>Routes: RouteObject[] = [];
   ```
4. `index.ts` re-exports only what the app needs — at minimum the routes:
   ```ts
   export { <feature>Routes } from './routes';
   ```
5. Register the feature in `apps/web/src/app/router.tsx`:
   - Add the import alphabetically with the existing feature imports.
   - Spread `...<feature>Routes` into the `children` array of `RootLayout` (before the `{ path: '*', element: <NotFound /> }` wildcard).
6. Run `pnpm build` to confirm TS is happy with the new imports.

## Conventions to enforce

- Use kebab-case for the folder name, camelCase for the routes export (`<feature>Routes`).
- All imports across features use the `@/` alias — never relative `../../features/...`.
- `index.ts` is the only public surface — anything not re-exported from there is considered feature-internal.
- Do **not** add the routes directly inside this skill — leave actual pages to `new-page`.
- Do **not** invent new files outside the canonical set listed in `CLAUDE.md` (Architecture → Feature-sliced layout).

## Verification

- `pnpm build` succeeds (TypeScript + Vite build).
- `pnpm lint` shows no errors related to the new files.
- Open `apps/web/src/app/router.tsx` and confirm the spread is in place.
- The empty `<feature>Routes` array compiling is enough — actual routes come via the `new-page` skill.
