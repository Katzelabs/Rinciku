---
name: new-page
description: Add a page to an existing WEB feature in apps/web/src/features/<feature>/, register the route in that feature's routes.tsx, and optionally scaffold a react-router v7 loader or action. Use when adding a route inside a feature that already exists. For mobile (Expo) screens, use mobile-screen instead.
---

# new-page

> **Web only.** This skill targets the React Router app at `apps/web`. To add a screen to the Expo app (`apps/mobile`, file-based expo-router), use the **`mobile-screen`** skill instead.

## When to use

- The user asks to "add a page" or "add a route" inside an existing **web** feature (e.g. "add a settings page to the dashboard feature").
- The page belongs to an existing feature folder under `apps/web/src/features/`. If the feature doesn't exist yet, run `new-feature` first.
- The page renders a route that the user can navigate to (not just an internal component).

## Steps

1. Identify the target feature folder under `apps/web/src/features/<feature>/`. Confirm with the user if ambiguous.
2. Create the page component at `apps/web/src/features/<feature>/pages/<page-name>.tsx`:
   - Default-export a React component.
   - Keep the page thin: composition of feature-local components (under the feature's `components/`) and data from loaders/hooks. No business logic in the page.
3. Add the route entry to `apps/web/src/features/<feature>/routes.tsx`:
   ```tsx
   import type { RouteObject } from 'react-router';
   import <PageName> from './pages/<page-name>';

   export const <feature>Routes: RouteObject[] = [
     { path: '/<route-path>', element: <<PageName> /> },
   ];
   ```
4. If the page needs server data on navigation, add a `loader` function to `apps/web/src/features/<feature>/loaders.ts`, wire it to the route entry (`loader: <loaderName>`), and call the feature's `api.ts` from inside it. For form submissions or mutations, do the same with `actions.ts` and `action:`.
5. Confirm the route is reachable: the feature's routes are already spread into `apps/web/src/app/router.tsx` (done by `new-feature`). No router changes needed unless this is a brand-new feature.
6. Run `pnpm build`.

## Conventions to enforce

- Page files live under `apps/web/src/features/<feature>/pages/`, kebab-case filenames, PascalCase default export.
- Routes export stays a typed `RouteObject[]` named `<feature>Routes`.
- Loaders and actions live in the feature's `loaders.ts` / `actions.ts` — do not inline them in `routes.tsx`.
- Loaders/actions call the feature's `api.ts` functions; they don't talk to Supabase directly.
- Use `@/` import alias for anything outside the current feature.
- Trust the React Compiler — no manual `useMemo`/`useCallback` for performance.

## Verification

- `pnpm build` succeeds.
- `pnpm dev` and navigate to the new path in a browser to confirm the route resolves and the page renders.
- If a loader/action was added, exercise that flow end-to-end (page load triggers loader; form submit triggers action).
