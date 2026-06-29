import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * Shared flat-config building blocks for the Rinciku monorepo. Consumers wrap
 * the returned array in `defineConfig` from 'eslint/config' so the nested
 * `extends` keys are expanded.
 */

/** Base lint rules for plain TypeScript packages (no React). */
export function baseConfig() {
  return [
    {
      files: ['**/*.{ts,tsx}'],
      extends: [js.configs.recommended, tseslint.configs.recommended],
      languageOptions: {
        globals: globals.browser,
      },
    },
  ];
}

/**
 * React Hooks rules for React Native (Expo) apps. Mirrors `reactConfig` but
 * drops the web-only `react-refresh/vite` plugin and swaps browser globals for
 * the React Native runtime: `__DEV__` plus the browser/node names RN polyfills
 * (`fetch`, `console`, timers).
 */
export function reactNativeConfig() {
  return [
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        reactHooks.configs.flat.recommended,
      ],
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
          __DEV__: 'readonly',
        },
      },
      rules: {
        // Metro resolves static assets/fonts via `require('./foo.png')`; this is
        // the idiomatic React Native pattern, so the web-oriented ban is off.
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ];
}

/** Base rules plus the React Hooks + Refresh plugins for app/UI packages. */
export function reactConfig() {
  return [
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        globals: globals.browser,
      },
    },
  ];
}
