// lucide's `exports` field only publishes "." and "./icons" (both full barrels),
// so TypeScript can't resolve the per-icon subpaths that src/lib/icons.ts
// deep-imports to keep ~1500 unused icons out of the bundle. Metro reaches the
// real files via a resolver alias (metro.config.js); this ambient wildcard gives
// TS the matching types.
declare module 'lucide-react-native/icons/*' {
  import type { LucideIcon } from 'lucide-react-native';
  const icon: LucideIcon;
  export default icon;
}
