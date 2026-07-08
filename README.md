# Rinciku

> **Rinciku** ("rincian keuanganku" — _my financial details_) is an AI-powered, **cross-platform** personal finance companion for people with mixed IDR/USD income and variable monthly expenses.

Built for young Indonesian adults (18–30) who earn across currencies, have no financial advisor, and find generic budgeting apps give generic advice. Rinciku ships as a **web app** (Vite + React) and a **native mobile app** (Expo, iOS + Android) that share one portable domain layer.

## The problem

Most budgeting apps assume a single currency, a stable paycheck, and that you'll diligently categorize every transaction. Real life for the target user is messier — income arrives in both IDR and USD, expenses swing month to month, and the advice you actually need is _"can I afford this right now?"_ — not a monthly report after the money's already spent.

Rinciku's differentiator is **in-the-moment AI purchase consultation grounded in your real budget state** (income received, essentials baseline, spending so far, days left in the month) — paired with **frictionless logging** via natural-language chat and receipt-image upload, so the data actually gets captured.

## Key features

- 🔐 **Auth + profile onboarding** — Supabase-backed sign-up, sign-in, and step-by-step profile setup
- 🧾 **Essentials planner** — define fixed bills and recurring costs to establish a monthly baseline
- 💬 **Expense logging via chat** — natural language ("spent 45k on lunch") parsed into structured entries
- 📷 **Expense logging via image** — receipts, bank transfers, and invoices read via vision models
- 💱 **Multi-currency** — IDR + USD with live or fixed FX rates
- 🗂️ **Three-tier categories** — Fixed / Needs / Wants
- 📊 **Monthly dashboard** — actual vs budget breakdown, needs-vs-wants split, budget health
- 🤖 **AI purchase consultation** — context-aware "can I buy this?" advice using your live budget state
- 🎯 **Budget targets** — per-category monthly limits
- 💰 **Income tracking** — multi-currency income records
- 🌐 **Bilingual UI** — English and Indonesian
- 📱 **Web + native** — the same brain drives the Vite web app and the Expo iOS/Android app

## Monorepo layout

Rinciku is a **pnpm + Turborepo** monorepo. The two apps **share a brain, never a face**: portable domain logic (data access, Zod schemas, types, formatting, i18n) lives in `packages/*` and is consumed by both apps; UI, routing, and caching stay per-app.

```
apps/
├─ web/                 # @rinciku/web — Vite + React + shadcn/ui web app
└─ mobile/              # @rinciku/mobile — Expo (React Native) app, iOS + Android only

packages/
├─ domain/              # @rinciku/domain — portable per-feature "brain": create<Feature>Api(db), Zod schemas, types
├─ core/                # @rinciku/core — format, locale, currency, fx, cycle, csv, i18n
├─ db/                  # @rinciku/db — Supabase client factories (web/SSR + RN) + generated Database types
└─ config/              # @rinciku/config — shared ESLint flat configs + tsconfig base

supabase/               # CLI config, declarative schemas, generated migrations, Edge Functions
docs/                   # PROJECT_BRIEF.md, schema.md, design-system.md, tasks/
```

- **Packages are consumed as TypeScript source** (no build step) — each `package.json` `exports` points at `./src/*.ts`; Vite, `tsc`, and Metro transpile them. Import as `@rinciku/core`, `@rinciku/domain/<feature>`, etc.
- **`@rinciku/domain` is the shared data/validation layer** — each feature exports `create<Feature>Api(db, deps)` with the Supabase client dependency-injected, so the same query/mutation code runs on web and native. Each app binds the factory in a thin `features/<feature>/api.ts` shim.

## Tech stack

| Area           | Web (`apps/web`)                                    | Mobile (`apps/mobile`)                                 |
| -------------- | --------------------------------------------------- | ------------------------------------------------------ |
| Framework      | React 19                                            | React 19 + React Native 0.85                           |
| Platform       | Vite 8                                              | Expo SDK 56 (iOS + Android; web target OFF)            |
| Routing        | React Router 7 (data APIs — loaders/actions)        | expo-router (file-based, typed routes) + NativeTabs    |
| Styling        | Tailwind CSS v4 (CSS-first) + shadcn/ui             | RN `StyleSheet` + design tokens; iOS Liquid Glass      |
| Optimization   | React Compiler                                      | React Compiler                                         |

**Shared across both:** TypeScript 6 (strict) · Supabase (PostgreSQL, Auth, RLS, Storage, Edge Functions) · react-hook-form 7 + Zod 4 · i18next / react-i18next (EN + ID) · portable `@rinciku/*` domain, core, db, and config packages.

**Tooling:** Turborepo · ESLint (flat config) + Prettier · **Runtime:** Node `>=24 <26` · **Package manager:** [pnpm](https://pnpm.io)

## Getting started

### Prerequisites

- Node `>=24 <26`
- [pnpm](https://pnpm.io)
- [Supabase CLI](https://supabase.com/docs/guides/local-development) (for the local backend)
- For mobile: Xcode (iOS) and/or Android Studio — Expo Go is **not** enough (Liquid Glass needs a dev build)

### Setup

```bash
# 1. Install dependencies (from the repo root — wires up all workspaces)
pnpm install

# 2. Start the local Supabase stack (Postgres, Auth, Storage, Edge Functions)
supabase start
supabase db reset            # applies the schema from supabase/schemas/

# 3. Configure environment for each app you'll run
cp apps/web/.env.example apps/web/.env         # fill in VITE_SUPABASE_* from `supabase status`
cp apps/mobile/.env.example apps/mobile/.env   # fill in EXPO_PUBLIC_SUPABASE_*
```

### Run

Dev servers are **per-app** — target the workspace (a bare `pnpm dev` runs both at once):

```bash
pnpm --filter @rinciku/web dev       # Vite dev server (web)
pnpm --filter @rinciku/mobile start  # Expo dev server (mobile)
pnpm --filter @rinciku/mobile ios    # native run via local Xcode
pnpm --filter @rinciku/mobile android
```

> The database schema is **declarative** — `supabase/schemas/*.sql` is the source of truth and `supabase/migrations/*.sql` are generated artifacts. See [`CLAUDE.md`](CLAUDE.md) for the full schema workflow.

## Scripts (run from the repo root)

Root scripts are orchestrated by **Turborepo** and fan out across workspaces:

| Script           | What it does                                                    |
| ---------------- | -------------------------------------------------------------- |
| `pnpm dev`       | `turbo run dev` — starts **both** the web and Expo dev servers |
| `pnpm build`     | `turbo run build` — web runs `tsc -b && vite build`            |
| `pnpm typecheck` | `turbo run typecheck` across all workspaces                    |
| `pnpm lint`      | `turbo run lint` across all workspaces                         |
| `pnpm format`    | Prettier write across the repo                                 |
| `pnpm gen:types` | Regenerate `packages/db/src/database.types.ts` from the local DB |

Target a single workspace with `pnpm --filter @rinciku/<web|mobile|core|domain|db|config> <script>`.

## Environment variables

Client variables are per-app and gitignored. Only the names are shown here — never commit values.

**Web** (`apps/web/.env`):

| Variable                       | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `VITE_SUPABASE_URL`            | Supabase project URL (local or remote)           |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| Supabase publishable key (safe in the client)    |

**Mobile** (`apps/mobile/.env`, inlined at build time):

| Variable                              | Purpose                          |
| ------------------------------------- | -------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`            | Supabase project URL             |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`| Supabase publishable key         |

Server-side secrets used by Edge Functions (e.g. `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are set via `supabase secrets set …` and **never** reach the client.

## Architecture notes

- **Shared brain, per-app face** — data/validation/formatting live in `@rinciku/*`; each app owns only its UI, routing, and caching.
- **Dependency-injected Supabase client** — `create<Feature>Api(db)` never imports a client, so one copy of the data layer runs on both web and native.
- **Feature-sliced organization** — features are self-contained; web aggregates routes in `apps/web/src/app/router.tsx`, mobile routes are files under `apps/mobile/src/app/`.
- **Declarative Supabase schema** — edit `supabase/schemas/`, regenerate migrations via `supabase db diff`.
- **AI keys stay server-side** — the `ai-chat` Edge Function proxies model calls so API keys never reach the client.
- **React Compiler enabled** (both apps) — follow the Rules of React; avoid hand-written `useMemo`/`useCallback`.

For deeper context, see [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) (product vision & MVP), [`docs/schema.md`](docs/schema.md) (database design), [`docs/design-system.md`](docs/design-system.md) (visual rules), and [`CLAUDE.md`](CLAUDE.md) (full architecture & workflows). App-specific detail lives in [`apps/web`](apps/web) and [`apps/mobile/README.md`](apps/mobile/README.md).

## Status & license

🚧 Early-stage, work in progress. Private repository.

**License:** TBD
