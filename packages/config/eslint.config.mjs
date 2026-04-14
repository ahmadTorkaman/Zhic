import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Shared flat ESLint config for the Zhic monorepo.
 * Consumers re-export this from their own `eslint.config.mjs`.
 */
const config = [
  { ignores: ['**/.next/**', '**/.turbo/**', '**/dist/**', '**/node_modules/**', '**/next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
  ...nextTs,
];

export default config;
