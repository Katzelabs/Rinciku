// Metro config for the pnpm + Turborepo monorepo.
// Resolves the symlinked `@rinciku/*` workspace packages and transpiles their
// raw TypeScript source (they ship no build step — `exports` points at `./src`).
// See https://docs.expo.dev/guides/monorepo/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Directory of an installed package, found by resolving its entry point and
// walking up to the nearest package.json. Packages whose `exports` field omits
// "./package.json" (most of them) can't be located any more directly.
function packageRootOf(name) {
  let dir = path.dirname(require.resolve(name, { paths: [projectRoot] }));
  while (!fs.existsSync(path.join(dir, 'package.json'))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`Cannot find package root for ${name}`);
    dir = parent;
  }
  return dir;
}

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

// 3. Bypass lowlight's barrel. Its index.js unconditionally re-exports `all`
//    (192 highlight.js grammars) and `common` (37) alongside `createLowlight`,
//    and Metro does not tree-shake — so importing *anything* from 'lowlight'
//    dragged every grammar into the bundle (~1.8MB). `lib/index.js` exports
//    only createLowlight (it imports highlight.js/lib/core and nothing else),
//    but lowlight's `exports` field is the bare string "./index.js", which
//    blocks deep imports — hence the resolver alias rather than an import path.
//    code-block.tsx registers the handful of grammars it actually needs.
//    (Resolve the package root and join, rather than require.resolve-ing the
//    subpath directly — Node enforces that same `exports` field and would throw
//    ERR_PACKAGE_PATH_NOT_EXPORTED.)
const lowlightCore = path.join(packageRootOf('lowlight'), 'lib/index.js');

// 4. Per-icon deep imports for lucide. Its barrel exports ~1500 icons and Metro
//    does not tree-shake, so a single named import shipped ~3MB. Its `exports`
//    field publishes only "." and "./icons" (both full barrels), so the real
//    per-icon files are unreachable by path — alias them. src/lib/icons.ts is
//    the only place that should use these specifiers.
//    (require.resolve lands on whichever entry the `require` condition picks —
//    dist/cjs — so walk up to the package root instead of assuming the layout.)
const lucideRoot = packageRootOf('lucide-react-native');
const lucideIconsDir = path.join(lucideRoot, 'dist/esm/icons');

const LUCIDE_ICON_RE = /^lucide-react-native\/icons\/(.+)$/;

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'lowlight') {
    return { type: 'sourceFile', filePath: lowlightCore };
  }

  const lucideIcon = LUCIDE_ICON_RE.exec(moduleName);
  if (lucideIcon) {
    return {
      type: 'sourceFile',
      filePath: path.join(lucideIconsDir, `${lucideIcon[1]}.mjs`),
    };
  }

  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
