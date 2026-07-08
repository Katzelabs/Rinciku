# @rinciku/mobile

Rinciku's [Expo](https://expo.dev) (React Native) app — **iOS + Android only**. The
Expo web target is intentionally OFF: the web app stays the standalone Vite + shadcn
app at `apps/web`. The two apps share a brain (`packages/*`), never a face.

This is a workspace in the pnpm + Turborepo monorepo. Run pnpm from the repo root.
`metro.config.js` watches the monorepo root so the symlinked `@rinciku/*` source
transpiles; hierarchical `node_modules` lookup stays **on** (a pnpm requirement —
don't disable it).

## Develop

```bash
pnpm install                          # from repo root — wires workspace packages
cp .env.example .env                  # fill in EXPO_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY

# Start the dev server (local dev build; Liquid Glass needs a dev build, not Expo Go)
pnpm --filter @rinciku/mobile start

# Native builds via local Xcode / Gradle (no EAS yet)
pnpm --filter @rinciku/mobile ios
pnpm --filter @rinciku/mobile android
```

## Tooling

Mobile participates in the monorepo's Turborepo pipelines and shares the root
toolchain (one ESLint + TypeScript + Prettier setup across all workspaces):

```bash
pnpm typecheck    # tsc --noEmit (this workspace: pnpm --filter @rinciku/mobile typecheck)
pnpm lint         # eslint . via @rinciku/config's reactNativeConfig()
pnpm format       # prettier --write . (repo root)
```

- **ESLint:** `eslint.config.mjs` consumes `reactNativeConfig()` from `@rinciku/config`.
  `*.web.*` files and generated/native dirs (`.expo`, `ios`, `android`) are ignored.
- **TypeScript:** extends `expo/tsconfig.base`; `@/*` → `./src/*`.

## Architecture

UI is native primitives + iOS 26 Liquid Glass chrome (`expo-glass-effect`,
expo-router NativeTabs) over shared brand tokens — no Material kit; glass on the
nav/chrome layer only, content stays solid; Android renders solid branded
equivalents. Shared data/domain logic comes from `@rinciku/*` workspace packages
(Supabase client dependency-injected). See [`CLAUDE.md`](CLAUDE.md) and
[`AGENTS.md`](AGENTS.md) in this folder for app-local conventions, and the repo
root [`CLAUDE.md`](../../CLAUDE.md) for the full monorepo architecture.
