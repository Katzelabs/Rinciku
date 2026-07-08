# @rinciku/landing

Rinciku's marketing landing page — an [Astro](https://astro.build) **static site (SSG)**.
Separate from the product apps: the web app stays the Vite + shadcn app at `apps/web`,
the mobile app is the Expo app at `apps/mobile`. This page's only job is to sell the
differentiator — **in-the-moment AI purchase consultation grounded in your real budget** —
and send visitors to the web app to sign up.

This is a workspace in the pnpm + Turborepo monorepo. Run pnpm from the repo root.

## Develop

```bash
pnpm install                           # from repo root — wires workspace packages
cp .env.example .env                   # set PUBLIC_WEB_APP_URL (the CTA target)

pnpm --filter @rinciku/landing dev     # Astro dev server → http://localhost:4321
pnpm --filter @rinciku/landing build   # static output to dist/
pnpm --filter @rinciku/landing preview # serve the built site locally
```

## Tooling

Landing participates in the monorepo's Turborepo pipelines and shares the root
toolchain:

```bash
pnpm typecheck    # astro check (this workspace: pnpm --filter @rinciku/landing typecheck)
pnpm lint         # eslint . — @rinciku/config baseConfig() + eslint-plugin-astro
pnpm format       # prettier --write . (repo root; .astro via prettier-plugin-astro)
```

- **ESLint:** `eslint.config.js` combines `@rinciku/config`'s `baseConfig()` (for `.ts`)
  with `eslint-plugin-astro` (for `.astro`).
- **TypeScript:** extends `astro/tsconfigs/strict` (Astro needs its own `astro:*` types —
  it does **not** use `@rinciku/config`'s tsconfig base).

## Architecture

- **Bilingual** EN + ID via Astro's built-in i18n routing (`prefixDefaultLocale: false`):
  English at `/`, Indonesian at `/id/`. Marketing copy lives in typed objects at
  `src/i18n/{en,id}.ts`, both satisfying one `Copy` type so the two locales can't drift.
  This deliberately does **not** reuse `@rinciku/core`'s react-i18next — that's the app's
  UI strings; this is static marketing copy.
- **Brand match, zero setup drift.** Tailwind v4 via `@tailwindcss/vite` (same plugin as
  the web app); the OKLch olive/lime tokens + Figtree in `src/styles/global.css` are the
  **light slice** copied from `apps/web/src/index.css`. Light-only for v1. Lime stays an
  accent (highlight / pill), never a text fill — see `docs/design-system.md`.
- **Sections** (all `.astro`, composed by `src/components/LandingPage.astro`): Nav · Hero ·
  Problem · Differentiator · Features · How it works · Compare · Final CTA · Footer. Pages
  (`src/pages/index.astro`, `src/pages/id/index.astro`) are one-liners passing a locale.
- **Screenshots** are real web-app captures in `src/assets/screenshots/`, rendered via
  `astro:assets` `<Image>` (build-time responsive WebP — requires `sharp`).
- **CTA** "Try Rinciku free" points at the web app's sign-up via `PUBLIC_WEB_APP_URL`.
  `site` is `https://rinciku.com`; the build emits a sitemap + OG / hreflang meta.

## Environment

| Variable             | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `PUBLIC_WEB_APP_URL` | URL the "Try free" CTA links to (the web app sign-up)      |
| `PUBLIC_GITHUB_URL`  | Optional — repo link in the footer                         |

Astro exposes `PUBLIC_`-prefixed vars to the client. Copy `.env.example` → `.env`.

## Generated assets

Favicons, app icons, and the 1200×630 OG card are produced from brand SVGs by
`scripts/generate-assets.mjs` (uses `sharp`). Re-run it if the brand mark or the OG
headline changes:

```bash
node scripts/generate-assets.mjs   # writes apple-touch-icon / icon-*/ favicon-32 / og.png into public/
```

## Before deploy

- Set `PUBLIC_WEB_APP_URL` for the target env (defaults to `https://app.rinciku.com`); the
  CTA, `/privacy`, and `/terms` links derive from it. Optionally set `PUBLIC_GITHUB_URL`.
- Add analytics (privacy-friendly, e.g. Plausible) and a host config
  (`vercel.json` / `netlify.toml`) once the host is chosen.
- Static output — deploy `dist/` to any static host (Vercel / Netlify; no adapter needed).

See the repo root [`CLAUDE.md`](../../CLAUDE.md) for the full monorepo architecture.
