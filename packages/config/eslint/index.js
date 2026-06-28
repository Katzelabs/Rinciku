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
