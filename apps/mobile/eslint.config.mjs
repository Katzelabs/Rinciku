import { defineConfig, globalIgnores } from 'eslint/config';
import { reactNativeConfig } from '@rinciku/config/eslint';

export default defineConfig([
  // Expo web target is OFF (web stays the Vite app), so `*.web.*` platform
  // overrides are dead code and excluded from lint alongside generated/native dirs.
  globalIgnores([
    '.expo',
    'dist',
    'ios',
    'android',
    'scripts',
    'expo-env.d.ts',
    '**/*.web.{ts,tsx}',
  ]),
  ...reactNativeConfig(),
]);
