---
name: mobile-screen
description: Add a screen (route) to the Rinciku Expo app at apps/mobile using expo-router's file-based routing. Place the screen file under src/app/ in the correct route group, follow the StyleSheet + theme-token + i18n conventions, and reach data through the feature's @rinciku/domain-bound api shim. Use for mobile screens; for web pages use new-page.
---

# mobile-screen

> **Expo SDK 56.** Before using any Expo/React Native API, read the versioned docs at https://docs.expo.dev/versions/v56.0.0/ — APIs shift across SDKs (`apps/mobile/AGENTS.md` enforces this).

## When to use

- The user asks to add a screen/route/tab to the **mobile** app (e.g. "add a budgets screen", "add a transaction detail screen").
- For a brand-new feature with no domain slice yet, run `new-feature` first. For **web** routes, use `new-page`.

## How routing works here (read first)

expo-router is **file-based** — the file's path under `apps/mobile/src/app/` *is* the route. Route groups (parenthesized, non-URL) organize the app:

```
src/app/
  _layout.tsx            ← root: providers + auth guards (Stack.Protected on session/onboarded) — DON'T add guards in screens
  (auth)/                ← signed-out: sign-in, sign-up, forgot-password
  (onboarding)/          ← signed-in but no profile.onboarded_at
  (app)/                 ← authenticated shell; _layout.tsx renders NativeTabs
    (dashboard)/  (expenses)/  (ai)/  (more)/   ← one route group per tab, each with its own _layout.tsx Stack
  auth/callback.tsx  reset-password.tsx  +not-found.tsx   ← deep-link / fallback routes
```

- `index.tsx` in a group is that group's default screen; other files (`new.tsx`, `settings.tsx`) are sibling routes within the tab's Stack.
- Typed routes are ON (`experiments.typedRoutes`) — navigate with `useRouter().push('/(app)/(expenses)/new')` or `<Link href=...>`; paths are type-checked.

## Steps

1. **Pick the location.** Inside an existing tab → add the file to that tab's group (e.g. `src/app/(app)/(more)/budgets.tsx`). A brand-new tab → new `(tabname)/` group with `_layout.tsx` (a `Stack`) + `index.tsx`, then add a `<NativeTabs.Trigger name='(tabname)'>` to `src/app/(app)/_layout.tsx` (SF Symbol via `sf=`, Material icon via `md=`, label via `t('nav.items.<x>')`).
2. **Write the screen** as a default-exported RN component:
   ```tsx
   import { StyleSheet, View } from 'react-native';
   import { useTranslation } from 'react-i18next';
   import { useTheme } from '@/hooks/use-theme';

   export default function BudgetsScreen() {
     const { t } = useTranslation('budgets');
     const c = useTheme();
     return <View style={[styles.container, { backgroundColor: c.background }]}>{/* ... */}</View>;
   }

   const styles = StyleSheet.create({ container: { flex: 1, padding: 16 } });
   ```
   Keep it thin: compose feature components (`src/features/<feature>/components/`) and pull data via the feature's `api.ts` shim or a hook. No `supabase.from(...)` in a screen.
3. **Header / screen options** — set per-screen via `<Stack.Screen options={{ title }}>` in the group's `_layout.tsx`, or `export const unstable_settings` / a `<Stack.Screen>` entry. Don't re-implement headers manually; the group Stack owns them.
4. **Data & auth** — read session/profile with `useAuth()` from `@/features/auth/hooks/use-auth`. Don't add auth redirects in the screen; the root layout's `Stack.Protected` guards already gate `(auth)`/`(onboarding)`/`(app)`.
5. **i18n** — `useTranslation('<namespace>')`; add new keys to the feature's locale namespace (mirror existing ones). Never hardcode user-facing strings.
6. **Verify**: `pnpm --filter @rinciku/mobile typecheck`, then run the app (`pnpm --filter @rinciku/mobile ios`/`android` — a dev build, not Expo Go) and navigate to the screen.

## Conventions to enforce

- Screens live under `src/app/` only (expo-router owns routing). Feature logic/components live under `src/features/<feature>/`; shared UI under `src/components/`.
- **Styling: `StyleSheet` + tokens from `@/constants/theme`** (via `useTheme`/`useColorScheme`). **No Tailwind/NativeWind.** Reach for native feel with `@expo/ui`, `expo-glass-effect` (`GlassView`, gated by `isLiquidGlassAvailable()`), and `expo-symbols` (SF Symbols) before custom-drawing chrome. No Material Design kit.
- Respect safe areas: `useSafeAreaInsets()` / `SafeAreaView` from `react-native-safe-area-context`.
- Default-export the screen component (expo-router requires it); PascalCase name, kebab-case filename.
- Navigate with typed routes (`useRouter()` / `<Link>`); don't string-build URLs that bypass the type check.
- Data access flows screen → feature `api.ts` shim → `@rinciku/domain` factory. Keep portability rules intact (no domain edits that import RN/DOM/env).
- Don't touch the `ios/` (or future `android/`) native dirs for a JS screen.

## Verification

- `pnpm --filter @rinciku/mobile typecheck` is clean.
- The route resolves and renders on a device/simulator; navigation to/from it works.
- Strings render in both EN and ID via the language toggle.
- If it's a new tab, the native tab bar shows the trigger with its icon + label.
