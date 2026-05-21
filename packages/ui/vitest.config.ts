import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // jsdom is needed for React component tests in src/__tests__/
    // Pure math/util tests in test/ also work fine under jsdom.
    environment: 'jsdom',
    include: ['test/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    setupFiles: ['src/__tests__/setup.ts'],
  },
});
