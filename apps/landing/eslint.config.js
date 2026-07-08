import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPluginAstro from 'eslint-plugin-astro';
import { baseConfig } from '@rinciku/config/eslint';

export default defineConfig([
  globalIgnores(['dist', '.astro']),
  ...baseConfig(),
  ...eslintPluginAstro.configs.recommended,
]);
