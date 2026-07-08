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

## Deploy — Cloudflare Pages

The site is fully static, so **no Astro adapter is needed** (`@astrojs/cloudflare` is only for
SSR). Deploy the built `dist/` to Cloudflare Pages.

### Recommended: Git integration

In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**, pick this
repo and set:

| Setting                    | Value                              |
| -------------------------- | ---------------------------------- |
| Production branch          | `main`                             |
| Framework preset           | Astro                              |
| Root directory             | _(leave blank — repo root)_        |
| Build command              | `pnpm --filter @rinciku/landing build` |
| Build output directory     | `apps/landing/dist`                |

Cloudflare auto-detects pnpm from `pnpm-lock.yaml` + the root `packageManager` field and installs
workspace deps from the repo root (why root directory stays blank — a subdir install can't resolve
`workspace:*`). This gives automatic production deploys on `main` and preview deploys per PR.

**Environment variables** (Pages → Settings → Variables, set for Production _and_ Preview — Astro
inlines `PUBLIC_*` at build time):

| Variable             | Value                                                     |
| -------------------- | --------------------------------------------------------- |
| `PUBLIC_WEB_APP_URL` | `https://app.rinciku.com`                                 |
| `NODE_VERSION`       | `24` (or any `>=22.12` — Astro requires it; only needed if the build image defaults to older Node) |
| `PUBLIC_GITHUB_URL`  | _(optional)_ repo link for the footer                     |

**Custom domain:** Pages → Custom domains → add `rinciku.com` (matches `site` in
`astro.config.mjs`). The web app stays on its own `app.rinciku.com`.

`public/_headers` (copied to `dist/_headers`) sets immutable caching for `/_astro/*` and baseline
security headers — Cloudflare Pages applies it automatically.

### Alternative: direct upload (CLI)

```bash
pnpm --filter @rinciku/landing build
npx wrangler pages deploy apps/landing/dist --project-name rinciku-landing
```

### Still optional

- Analytics — Cloudflare Web Analytics (privacy-friendly, no cookie banner) fits well; enable it
  on the Pages project, or add a Plausible snippet.
- A custom bilingual 404 page.

See the repo root [`CLAUDE.md`](../../CLAUDE.md) for the full monorepo architecture.
