# Rinciku

> **Rinciku** ("rincian keuanganku" — _my financial details_) is an AI-powered personal finance companion for people with mixed IDR/USD income and variable monthly expenses.

Built for young Indonesian adults (18–30) who earn across currencies, have no financial advisor, and find generic budgeting apps give generic advice.

## The problem

Most budgeting apps assume a single currency, a stable paycheck, and that you'll diligently categorize every transaction. Real life for the target user is messier — income arrives in both IDR and USD, expenses swing month to month, and the advice you actually need is _"can I afford this right now?"_ — not a monthly report after the money's already spent.

Rinciku's differentiator is **in-the-moment AI purchase consultation grounded in your real budget state** (income received, essentials baseline, spending so far, days left in the month) — paired with **frictionless logging** via natural-language chat and receipt-image upload (Claude Vision), so the data actually gets captured.

## Key features

- 🔐 **Auth + profile onboarding** — Supabase-backed sign-up, sign-in, and step-by-step profile setup
- 🧾 **Essentials planner** — define fixed bills and recurring costs to establish a monthly baseline
- 💬 **Expense logging via chat** — natural language ("spent 45k on lunch") parsed into structured entries
- 📷 **Expense logging via image** — receipts, bank transfers, and invoices read via Claude Vision
- 💱 **Multi-currency** — IDR + USD with live or fixed FX rates
- 🗂️ **Three-tier categories** — Fixed / Needs / Wants
- 📊 **Monthly dashboard** — actual vs budget breakdown, needs-vs-wants split, budget health
- 🤖 **AI purchase consultation** — context-aware "can I buy this?" advice using your live budget state
- 🎯 **Budget targets** — per-category monthly limits
- 💰 **Income tracking** — multi-currency income records
- 🌐 **Bilingual UI** — English and Indonesian

## Tech stack

| Area              | Technology                                                          |
| ----------------- | ------------------------------------------------------------------- |
| Framework         | React 19                                                            |
| Build tool        | Vite 8                                                              |
| Language          | TypeScript 6 (strict)                                               |
| Styling           | Tailwind CSS v4 (CSS-first config, no `tailwind.config`)            |
| Components        | shadcn/ui (`radix-rhea` style, `olive` base color, lucide icons)    |
| Routing           | React Router 7 (data APIs — loaders/actions)                        |
| Forms             | react-hook-form 7 + Zod 4 (`@hookform/resolvers`)                   |
| Backend           | Supabase — PostgreSQL, Auth, RLS, Storage, Edge Functions           |
| i18n              | i18next / react-i18next (EN + ID)                                   |
| Charts            | Recharts                                                            |
| UX                | sonner (toasts), next-themes (theming), react-markdown              |
| Optimization      | React Compiler (Babel plugin)                                       |
| Tooling           | ESLint (flat config) + Prettier                                     |

**Runtime:** Node `>=24 <26` · **Package manager:** [pnpm](https://pnpm.io)

## Screenshots

<!-- Add screenshots to docs/screenshots/ and uncomment as they become available -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![AI purchase consultation](docs/screenshots/ai-chat.png) -->
<!-- ![Expense logging](docs/screenshots/expenses.png) -->

_Screenshots coming soon._

## Getting started

### Prerequisites

- Node `>=24 <26`
- [pnpm](https://pnpm.io)
- [Supabase CLI](https://supabase.com/docs/guides/local-development) (for the local backend)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Start the local Supabase stack (Postgres, Auth, Storage, Edge Functions)
supabase start
supabase db reset   # applies the schema from supabase/schemas/

# 4. Run the dev server
pnpm dev
```

> The database schema is **declarative** — `supabase/schemas/*.sql` is the source of truth and `supabase/migrations/*.sql` are generated artifacts. See `CLAUDE.md` for the full schema workflow.

## Scripts

| Script         | What it does                              |
| -------------- | ----------------------------------------- |
| `pnpm dev`     | Start the Vite dev server                 |
| `pnpm build`   | Typecheck (`tsc -b`) + production build    |
| `pnpm lint`    | Run ESLint                                |
| `pnpm format`  | Format the repo with Prettier             |
| `pnpm preview` | Preview the production build locally       |

## Environment variables

Client variables live in `.env.local` (gitignored). Only the names are shown here — never commit values.

| Variable                 | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `VITE_SUPABASE_URL`      | Supabase project URL (local or remote)           |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key (safe in client) |

Server-side secrets used by Edge Functions (e.g. `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are set via `supabase secrets set …` and **never** reach the browser.

## Project structure

The codebase uses a **feature-sliced** layout — each feature owns the same file set and registers its own routes.

```
src/
├─ app/                    # App shell
│  ├─ router.tsx           # composes all feature routes
│  ├─ root-layout.tsx      # layout + providers wrapper
│  ├─ providers.tsx        # theme, auth, i18n, FX bootstrap, toaster
│  ├─ error-boundary.tsx
│  └─ not-found.tsx
├─ features/               # one folder per domain area
│  ├─ ai-chat/             # AI consultation + conversation history
│  ├─ auth/                # sign-up/in, onboarding, route guards
│  ├─ budgets/             # per-category budget targets
│  ├─ categories/          # category CRUD + tiers
│  ├─ dashboard/           # monthly overview & breakdowns
│  ├─ essentials/          # essentials baseline planner
│  ├─ expenses/            # expense CRUD, multi-currency logging
│  ├─ fx-rates/            # FX rate fetching & storage
│  ├─ incomes/             # income CRUD
│  └─ legal/               # privacy / terms pages
├─ components/             # shared + shadcn/ui components
├─ lib/                    # utilities (Supabase client, FX helpers, cn())
├─ hooks/                  # shared hooks
└─ i18n/                   # i18next setup + locales (en / id)

supabase/
├─ schemas/                # declarative SQL — source of truth
├─ migrations/             # generated artifacts (do not hand-edit)
└─ functions/              # Edge Functions (ai-chat, delete-account)
```

Each feature folder follows the same anatomy: `api.ts`, `routes.tsx`, `pages/`, `components/`, `schemas.ts`, `hooks/`, `loaders.ts`, `actions.ts`, `types.ts`, `index.ts`.

## Architecture notes

- **Feature-sliced organization** — features are self-contained and aggregated in `src/app/router.tsx`.
- **Declarative Supabase schema** — edit `supabase/schemas/`, regenerate migrations via `supabase db diff`.
- **AI keys stay server-side** — the `ai-chat` Edge Function proxies model calls so API keys never reach the client.
- **React Compiler enabled** — follow the Rules of React; avoid hand-written `useMemo`/`useCallback`.
- **Path alias** — `@/*` → `./src/*` for cross-feature imports.

For deeper context, see [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) (product vision & MVP) and [`docs/schema.md`](docs/schema.md) (database design).

## Status & license

🚧 Early-stage, work in progress. Private repository.

**License:** TBD
