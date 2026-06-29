// Metro config for the pnpm + Turborepo monorepo.
// Resolves the symlinked `@rinciku/*` workspace packages and transpiles their
// raw TypeScript source (they ship no build step — `exports` points at `./src`).
// See https://docs.expo.dev/guides/monorepo/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so the real files behind the `@rinciku/*`
//    symlinks (under packages/*) are watched and transpiled as project source.
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from the app first, then the monorepo root. Hierarchical
//    lookup stays ON: pnpm nests each package's transitive deps in the .pnpm
//    store, so Metro must walk up the tree to find them (disabling it is the
//    npm/yarn-hoisted recipe and breaks pnpm).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
