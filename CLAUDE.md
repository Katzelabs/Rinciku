# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Rinciku** ("rincian keuanganku" — my financial details) is an AI-powered personal finance web app for users with mixed IDR/USD income and variable monthly expenses. The differentiator vs. typical finance apps is **in-the-moment AI purchase consultation** grounded in the user's real budget state (income, essentials baseline, spending so far, days left in month) — not generic advice. See `docs/PROJECT_BRIEF.md` for the full product brief, MVP feature list, and target user.

The codebase is an early scaffold: feature folders and routes exist as empty stubs (`actions.ts`, `api.ts`, etc. are placeholder files). When implementing a feature, populate these stub files rather than inventing a new structure.

## Commands

Package manager is **pnpm** (see `pnpm-workspace.yaml`). Node `>=24 <26`.

- `pnpm dev` — Vite dev server
- `pnpm build` — `tsc -b && vite build` (typecheck is part of build; run it to catch type errors)
- `pnpm lint` — ESLint flat config
- `pnpm format` — Prettier write across the repo
- `pnpm preview` — preview production build

There is no test runner configured yet.

## Architecture

### Feature-sliced layout

`src/features/<feature>/` is the unit of organization. Each feature owns the same file set:

```
actions.ts     api.ts        components/   hooks/
index.ts       loaders.ts    pages/        routes.tsx
schemas.ts     types.ts
```

Conventions:

- `routes.tsx` exports a typed `RouteObject[]` (e.g. `authRoutes`). `index.ts` re-exports only what other features/app need (typically the routes).
- All feature route arrays are aggregated in `src/app/router.tsx` as children of `RootLayout`. To add routes for a new feature, create the folder, export `xxxRoutes` from its `index.ts`, then import & spread it in `router.tsx`.
- `loaders.ts` / `actions.ts` are intended for react-router v7 data APIs.
- `schemas.ts` is for Zod schemas (paired with `@hookform/resolvers` + react-hook-form).
- `api.ts` is the Supabase-facing data layer for the feature.

Current features (mostly stubs): `auth`, `dashboard`, `expenses`, `essentials`, `categories`, `budgets`, `ai-chat`.

### App shell

`src/main.tsx` → `RouterProvider` only. `src/app/`:
- `router.tsx` — single `createBrowserRouter` call composing all feature routes.
- `root-layout.tsx` — wraps `<Outlet />` in `Providers`.
- `providers.tsx` — currently a passthrough; add global context providers here (auth, query client, theme) rather than in `main.tsx`.
- `error-boundary.tsx`, `not-found.tsx` — router-level error and 404 handlers.

### Path alias

`@/*` → `./src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`). Always use `@/...` for cross-feature imports.

### UI layer

- **shadcn/ui** with `style: radix-rhea`, `baseColor: olive`, `iconLibrary: lucide` (see `components.json`). New shadcn components land in `src/components/ui/`.
- **Tailwind v4** via `@tailwindcss/vite` (no `tailwind.config.*` file — config lives in `src/index.css` using v4's CSS-first config).
- `src/components/shared/` for cross-feature reusable components; feature-local components stay under `src/features/<feature>/components/`.
- `cn()` helper in `src/lib/utils.ts` (clsx + tailwind-merge) — use it for conditional class composition.

### React Compiler

Enabled via `@rolldown/plugin-babel` + `babel-plugin-react-compiler` in `vite.config.ts`. Do not hand-write `useMemo`/`useCallback` micro-optimizations the compiler will handle; follow the Rules of React so the compiler can analyze components.

### Backend

Supabase (PostgreSQL + Auth + RLS) — local config scaffolded in `supabase/config.toml` (`project_id = "rinciku"`, Postgres 17, API on `:54321`, DB on `:54322`). No migrations or client wiring yet. Data access goes through each feature's `api.ts`.

### AI

Claude API for the purchase-consultation chat feature (`features/ai-chat`). The product brief pins a specific Sonnet model ID, but use the current latest Sonnet 4.x ID when actually wiring it up.

## Code style

- Prettier: single quotes (JSX too), semicolons, trailing-comma `es5`, 2-space indent.
- TypeScript is strict-ish: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` — use `import type` for type-only imports.
- ESLint flat config extends `js.configs.recommended`, `tseslint.configs.recommended`, `react-hooks` (flat), and `react-refresh/vite`.
