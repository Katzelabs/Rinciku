# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Rinciku** ("rincian keuanganku" — my financial details) is an AI-powered, **cross-platform** personal finance app (web + iOS/Android) for users with mixed IDR/USD income and variable monthly expenses. The differentiator vs. typical finance apps is **in-the-moment AI purchase consultation** grounded in the user's real budget state (income, essentials baseline, spending so far, days left in month) — not generic advice. See `docs/PROJECT_BRIEF.md` for the full product brief, MVP feature list, and target user.

The two apps share a **brain, never a face**: portable domain logic (data access, Zod schemas, types, formatting, i18n) lives in `packages/*` and is consumed by both `apps/web` (Vite + React + shadcn) and `apps/mobile` (Expo + React Native). UI, routing, and caching stay per-app.

Ongoing work is tracked in `docs/tasks/` — see the **Task tracking** section.

The codebase is an early scaffold: feature folders and routes exist as empty stubs (`actions.ts`, `api.ts`, etc. are placeholder files). When implementing a feature, populate these stub files rather than inventing a new structure.

## Commands

Package manager is **pnpm** (see `pnpm-workspace.yaml`), orchestrated by **Turborepo** (`turbo.json`). Node `>=24 <26`. Run from the repo root:

- `pnpm build` — `turbo run build` → `apps/web` runs `tsc -b && vite build` (typecheck is part of build)
- `pnpm typecheck` — `turbo run typecheck` across all workspaces
- `pnpm lint` — `turbo run lint` across all workspaces
- `pnpm format` — Prettier write across the repo
- `pnpm gen:types` — regenerate `packages/db/src/database.types.ts` from the local DB

**Dev servers are per-app — target the workspace** (a bare `pnpm dev` runs `turbo run dev`, which now fans out to *both* the web Vite server and the Expo bundler at once):

- `pnpm --filter @rinciku/web dev` — Vite dev server for the web app
- `pnpm --filter @rinciku/mobile start` — Expo dev server (needs a dev build, not Expo Go — Liquid Glass UI requires it)
- `pnpm --filter @rinciku/mobile ios` / `... android` — native run via local Xcode/Gradle (no EAS yet)

Target any single workspace with `pnpm --filter @rinciku/<web|mobile> <script>` (or `@rinciku/core`, `@rinciku/domain`, etc. for packages). There is no test runner configured yet. Turborepo **remote** caching is not set up yet (local caching works).

## Architecture

### Monorepo layout

This is a pnpm + Turborepo monorepo. The two apps and the shared layers are separate workspaces:

```
apps/web/                ← @rinciku/web: the Vite React app (everything below was once the root src/)
apps/mobile/             ← @rinciku/mobile: the Expo (React Native) app — iOS + Android only
packages/domain/         ← @rinciku/domain: portable per-feature "brain" — data access (create<Feature>Api(db)), Zod schemas, types
packages/core/           ← @rinciku/core: format, locale, currency-meta, fx, cycle, csv, attachments, i18n
packages/db/             ← @rinciku/db: createSupabaseClient() (web/SSR) + createMobileClient() (RN) factories + generated Database types
packages/config/         ← @rinciku/config: shared eslint flat configs (web + react-native) + tsconfig base
supabase/                ← stays at the repo ROOT (CLI config, schemas, migrations, edge functions)
```

- **Packages are consumed as TypeScript source** (no build step): each `package.json` `exports` points at `./src/*.ts`; Vite, `tsc`, and Metro transpile them. Import them as `@rinciku/core`, `@rinciku/core/i18n`, `@rinciku/db`, `@rinciku/domain/<feature>`.
- **`packages/domain` is the shared data/validation layer** (added in the M1/M2/M3 portability work). Each feature exports `create<Feature>Api(db, deps)` — the Supabase client (and any platform-specific values like deep-link redirects) are **dependency-injected**, so the same query/mutation code runs on web and native. See the **Shared domain layer** section below.
- **Keep shared code portable**: no `import.meta.glob`, no direct env access, no `window`/DOM, no browser- or RN-only APIs inside `packages/*`. Platform-coupled helpers stay in each app's `src/lib` (web `supabase.ts` reads `import.meta.env`; mobile `supabase.ts` reads `process.env.EXPO_PUBLIC_*` + AsyncStorage).
- **Deferred (manual later):** `apps/landing` (SSG), the GitHub org, remote caching, EAS (mobile builds are local Xcode/Gradle for now).

### Shared domain layer (`packages/domain`)

`@rinciku/domain` holds the portable, UI-free **brain** for each feature, shared by web and mobile. Layout mirrors the feature slices:

```
packages/domain/src/features/<feature>/
  api.ts       ← export function create<Feature>Api(db: TypedSupabaseClient, deps?) { ... }
  schemas.ts   ← Zod schema factories (makeX(t) for i18n) + inferred input types
  types.ts     ← row/domain types (often re-exported from @rinciku/db Database types)
  index.ts     ← export * from './api' / './schemas' / './types'
```

- **The Supabase client is dependency-injected, never imported.** `create<Feature>Api` takes a `TypedSupabaseClient` (and platform values like `AuthRedirects` for auth — functions read at call time, since web builds redirect URLs from `window.location` and native from its `rinciku://` deep-link scheme). This is what lets one copy of the data layer run on both platforms.
- **Each app binds the factory once in a thin shim.** `apps/web/src/features/<feature>/api.ts` and `apps/mobile/src/features/<feature>/api.ts` import `create<Feature>Api`, call it with that app's `supabase` client, and re-export the bound functions. The app-side `schemas.ts` / `types.ts` are usually one-line re-exports from `@rinciku/domain/<feature>`.
- **Where new data-access code goes:** the query/mutation logic lives in `packages/domain` (the `new-api` skill scaffolds this); the app `api.ts` only ever does the binding. Don't write `supabase.from(...)` calls in an app's `api.ts` — that breaks portability.
- Domain features currently extracted: `auth`, `categories`, `expenses`. Others are still web-local stubs pending the same extraction.

### Feature-sliced layout (web)

`apps/web/src/features/<feature>/` is the unit of organization. Each feature owns the same file set:

```
actions.ts     api.ts        components/   hooks/
index.ts       loaders.ts    pages/        routes.tsx
schemas.ts     types.ts
```

Conventions:

- `routes.tsx` exports a typed `RouteObject[]` (e.g. `authRoutes`). `index.ts` re-exports only what other features/app need (typically the routes).
- All feature route arrays are aggregated in `apps/web/src/app/router.tsx` as children of `RootLayout`. To add routes for a new feature, create the folder, export `xxxRoutes` from its `index.ts`, then import & spread it in `router.tsx`.
- `loaders.ts` / `actions.ts` are intended for react-router v7 data APIs.
- `schemas.ts` re-exports the feature's Zod schema factories from `@rinciku/domain/<feature>` (paired with `@hookform/resolvers` + react-hook-form). Web-only schemas can still live here.
- `api.ts` binds `create<Feature>Api` from `@rinciku/domain/<feature>` to the web `supabase` client and re-exports the result — it is a thin shim, not the data layer itself (see **Shared domain layer**). Features not yet extracted to `@rinciku/domain` may still hold their queries here as stubs.

Current features (mostly stubs): `auth`, `dashboard`, `expenses`, `essentials`, `categories`, `budgets`, `ai-chat`.

### App shell

`apps/web/src/main.tsx` → `RouterProvider` only (and a side-effect `import '@rinciku/core/i18n'`). `apps/web/src/app/`:
- `router.tsx` — single `createBrowserRouter` call composing all feature routes.
- `root-layout.tsx` — wraps `<Outlet />` in `Providers`.
- `providers.tsx` — currently a passthrough; add global context providers here (auth, query client, theme) rather than in `main.tsx`.
- `error-boundary.tsx`, `not-found.tsx` — router-level error and 404 handlers.

### Path alias

`@/*` → `apps/web/src/*` (configured in `apps/web/vite.config.ts` and `apps/web/tsconfig.app.json`). Use `@/...` for cross-feature imports **within the web app**; use `@rinciku/*` for the shared workspace packages.

### UI layer

- **shadcn/ui** with `style: radix-rhea`, `baseColor: olive`, `iconLibrary: lucide` (see `apps/web/components.json`). New shadcn components land in `apps/web/src/components/ui/`.
- **Tailwind v4** via `@tailwindcss/vite` (no `tailwind.config.*` file — config lives in `apps/web/src/index.css` using v4's CSS-first config).
- `apps/web/src/components/shared/` for cross-feature reusable components; feature-local components stay under `apps/web/src/features/<feature>/components/`.
- `cn()` helper in `apps/web/src/lib/utils.ts` (clsx + tailwind-merge) — use it for conditional class composition.

### React Compiler

Enabled via `@rolldown/plugin-babel` + `babel-plugin-react-compiler` in `apps/web/vite.config.ts`. Do not hand-write `useMemo`/`useCallback` micro-optimizations the compiler will handle; follow the Rules of React so the compiler can analyze components. (The mobile app also enables React Compiler via `experiments.reactCompiler` in `app.json`.)

### Mobile app (`apps/mobile`)

Expo **SDK 56**, React Native 0.85, React 19. **iOS + Android only — the Expo web target is OFF** (web stays the Vite app). Before writing any Expo code, read the versioned docs at https://docs.expo.dev/versions/v56.0.0/ — APIs changed across SDKs (`apps/mobile/AGENTS.md` enforces this). `apps/mobile/CLAUDE.md` and `apps/mobile/README.md` hold the app-local detail.

- **Routing — expo-router (file-based)** under `src/app/`, with typed routes (`experiments.typedRoutes`). Route groups: `(auth)`, `(onboarding)`, `(app)` (the authenticated shell). The root `_layout.tsx` is the **auth guard**: `<Stack.Protected guard={...}>` switches between `(auth)` / `(onboarding)` / `(app)` based on `session` and `profile.onboarded_at` from `useAuth()`, holding the splash screen until fonts + initial auth resolve. Deep-link routes `auth/callback` and `reset-password` stay reachable in any auth state (the `rinciku://` scheme from `app.json`).
- **Navigation chrome** uses `NativeTabs` from `expo-router/unstable-native-tabs` (`src/app/(app)/_layout.tsx`) — a real native tab bar (Liquid Glass on iOS 26+, Material 3 on Android), so don't tint it manually. Tabs: `(dashboard)`, `(expenses)`, `(ai)`, `(more)`; each is its own nested route group/Stack. A `GlassFab` overlay opens the new-expense screen.
- **Feature-sliced too**, but only the parts that aren't files-as-routes: `src/features/<feature>/` holds `api.ts` (binds the `@rinciku/domain` factory — same shim pattern as web), `schemas.ts`/`types.ts` re-exports, `components/`, and `hooks/`. Screens themselves live under `src/app/` (expo-router owns routing). Currently only `auth` is built out.
- **Supabase client** at `src/lib/supabase.ts` uses `createMobileClient(url, anonKey, AsyncStorage)` from `@rinciku/db` (base `createClient` + AsyncStorage session persistence — not the SSR/cookie path). Env is `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (inlined at build time; copy `.env.example` → `.env`). Token auto-refresh is driven off `AppState` in the root layout.
- **Auth context** lives in `src/features/auth/components/auth-provider.tsx` + `hooks/use-auth.ts` (exposes `{ session, user, profile, loading, refreshProfile }`). Components call `useAuth()`, never `supabase.auth.*` directly. Redirect targets are injected via `Linking.createURL(...)`.
- **Styling — NO Tailwind/NativeWind.** Plain React Native `StyleSheet` + design tokens in `src/constants/theme.ts` (olive palette ported from the web's Tailwind v4 OKLch config to sRGB hex; semantic names match web). Native iOS feel comes from `@expo/ui`, `expo-glass-effect` (`GlassView`, gated by `isLiquidGlassAvailable()`), `expo-symbols` (SF Symbols). **No Material Design kit.** Fonts: Figtree via `@expo-google-fonts/figtree`.
- **i18n** at `src/lib/i18n.ts` reuses `@rinciku/core/i18n/init` (NOT the browser `@rinciku/core/i18n` entry — it pulls a DOM-only detector). Device language via `expo-localization`, persisted to AsyncStorage. Must be provided through `<I18nextProvider>` in the root layout: under pnpm the app and `@rinciku/core` resolve different physical copies of `react-i18next`, so context bridges them — don't rely on the global instance alone.
- **Metro** (`metro.config.js`) watches the monorepo root so the symlinked `@rinciku/*` source transpiles; hierarchical `node_modules` lookup stays ON (pnpm requirement — do not disable it). ESLint uses `reactNativeConfig()` from `@rinciku/config/eslint`.

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

## Design system

`docs/design-system.md` is the canonical **rules + rationale** for how the app looks — read it before any UI work. Token *values* live in code (`apps/mobile/src/constants/theme.ts`; web mirror in `apps/web/src/index.css`). Load-bearing rules that are easy to accidentally revert: lime (`primary`) is an accent, never a big-number fill (use `foreground` / the `positive` token for money); `formatCurrency` is **symbol-based** (`packages/core/src/format.ts`) — do not revert to `Intl` `style: 'currency'`; category glyphs are emoji via `categoryEmoji` and colorless categories fall back to `categoryColorFor` (never the gray tag).

## Code style

- Prettier: single quotes (JSX too), semicolons, trailing-comma `es5`, 2-space indent.
- TypeScript is strict-ish: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` — use `import type` for type-only imports.
- ESLint flat config extends `js.configs.recommended`, `tseslint.configs.recommended`, `react-hooks` (flat), and `react-refresh/vite`.
