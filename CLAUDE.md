# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Rinciku** ("rincian keuanganku" — my financial details) is an AI-powered personal finance web app for users with mixed IDR/USD income and variable monthly expenses. The differentiator vs. typical finance apps is **in-the-moment AI purchase consultation** grounded in the user's real budget state (income, essentials baseline, spending so far, days left in month) — not generic advice. See `docs/PROJECT_BRIEF.md` for the full product brief, MVP feature list, and target user.

Ongoing work is tracked in `docs/tasks/` — see the **Task tracking** section.

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

Supabase (PostgreSQL + Auth + RLS) — local config scaffolded in `supabase/config.toml` (`project_id = "rinciku"`, Postgres 17, API on `:54321`, DB on `:54322`). Data access goes through each feature's `api.ts`.

**Schema is declarative.** `supabase/schemas/*.sql` is the source of truth (registered in `config.toml` under `schema_paths`). `supabase/migrations/*.sql` are generated artifacts — never hand-edit them. The full design lives in `docs/schema.md`.

Workflow during pre-release dev (no shared/remote DB yet):

1. Edit the relevant `supabase/schemas/NN_*.sql` file (and `docs/schema.md` if the change is design-level).
2. Delete the existing migration(s) in `supabase/migrations/` and regenerate a single rolling init with `supabase db diff -f init`. Keeping one migration avoids churn until the schema stabilizes.
3. `supabase db reset` to wipe local and reapply.

Once the app is deployed or the DB is shared, this rule flips: `db reset` is destructive, so changes must land as *new* additive migrations on top of the existing history (still generated via `supabase db diff -f <name>` against an edited schema).

### AI

Claude API for the purchase-consultation chat feature (`features/ai-chat`). The product brief pins a specific Sonnet model ID, but use the current latest Sonnet 4.x ID when actually wiring it up.

## Task tracking

`docs/tasks/` is the source of truth for ongoing work and progress. Layout mirrors `src/features/`:

```
docs/tasks/<feature>/README.md      — feature overview + task index with status
docs/tasks/<feature>/NN-<slug>.md   — one file per task (NN = two-digit order, e.g. 01-supabase-wiring.md)
```

Each task file starts with a `**Status:**` line (`not-started | in-progress | blocked | done`) followed by `## Goal`, `## Acceptance criteria` (checklist), and `## Notes` (append-only log).

When working with Claude:

- **Read** a task file when the user references it (by feature, number, or slug). Use it for context, acceptance criteria, and current progress — don't pre-load tasks otherwise.
- **Update** the task's status, checklist, and `## Notes` as work progresses on it.
- **Create** a new task file (and a feature folder + `README.md` if the feature is new to `docs/tasks/`) when the user asks to track new work. Pick the next `NN` prefix for that feature.

## Code style

- Prettier: single quotes (JSX too), semicolons, trailing-comma `es5`, 2-space indent.
- TypeScript is strict-ish: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` — use `import type` for type-only imports.
- ESLint flat config extends `js.configs.recommended`, `tseslint.configs.recommended`, `react-hooks` (flat), and `react-refresh/vite`.
