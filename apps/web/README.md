# @rinciku/web

Rinciku's web app — [Vite](https://vite.dev) + React 19 + [shadcn/ui](https://ui.shadcn.com).
This is the standalone web face; the native iOS/Android app lives at `apps/mobile`.
The two apps share a brain (`packages/*`), never a face.

This is a workspace in the pnpm + Turborepo monorepo. Run pnpm from the repo root;
the shared `@rinciku/*` packages are consumed as TypeScript source (no build step),
so Vite transpiles them directly.

## Develop

```bash
pnpm install                       # from repo root — wires workspace packages
cp .env.example .env               # fill in VITE_SUPABASE_URL / _PUBLISHABLE_KEY from `supabase status`

pnpm --filter @rinciku/web dev     # Vite dev server
pnpm --filter @rinciku/web build   # tsc -b && vite build (typecheck is part of build)
pnpm --filter @rinciku/web preview # preview the production build locally
```

Local scripts: `dev` · `build` · `lint` · `typecheck` · `preview`. From the repo
root, `pnpm dev` / `build` / `lint` etc. fan out to every workspace via Turborepo.

## Tech stack

- **Vite 8** + **React 19** (React Compiler enabled via Babel plugin)
- **React Router 7** — data APIs (loaders/actions); routes composed in `src/app/router.tsx`
- **Tailwind CSS v4** (CSS-first config in `src/index.css`, no `tailwind.config`) + **shadcn/ui** (`radix-rhea` style, `olive` base, lucide icons)
- **react-hook-form 7 + Zod 4** for forms (`@hookform/resolvers`)
- **Supabase** via `@rinciku/db` client factory; data access through `@rinciku/domain` feature APIs
- **Recharts** (charts), **sonner** (toasts), **next-themes** (theming), **react-markdown** + remark-gfm/rehype-highlight (AI chat)
- **i18next / react-i18next** (EN + ID) via `@rinciku/core/i18n`

## Architecture

The web app is **feature-sliced** — `src/features/<feature>/` owns its own routes,
pages, components, hooks, and a thin `api.ts` that binds the `@rinciku/domain`
factory to the web Supabase client.

```
src/
├─ app/          # shell: router.tsx, root-layout, providers, error-boundary, not-found
├─ features/     # ai-chat, auth, budgets, categories, dashboard, essentials,
│                #   expenses, fx-rates, incomes, legal
├─ components/   # shared/ + shadcn/ui primitives (ui/)
├─ lib/          # supabase client, cn(), utilities
├─ hooks/        # shared hooks
└─ index.css     # Tailwind v4 CSS-first config + design tokens
```

- **Path alias:** `@/*` → `./src/*` for cross-feature imports within the web app; use `@rinciku/*` for shared workspace packages.
- **Providers** (auth, theme, i18n, toaster) go in `src/app/providers.tsx`, not `main.tsx`.
- **React Compiler** is on — follow the Rules of React; don't hand-write `useMemo`/`useCallback`.

See the repo root [`README.md`](../../README.md) for the product overview and
[`CLAUDE.md`](../../CLAUDE.md) for full monorepo architecture and conventions.

## Deploy

The web app builds to a static SPA (`dist/`) and deploys to **Cloudflare Workers
Static Assets** (`wrangler.jsonc`) — unknown paths fall back to `index.html` so
client-side routes don't 404.
