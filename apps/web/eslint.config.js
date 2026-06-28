import { defineConfig, globalIgnores } from 'eslint/config';
import { reactConfig } from '@rinciku/config/eslint';

export default defineConfig([
  globalIgnores(['dist']),
  ...reactConfig(),
  {
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/hooks/use-mobile.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
