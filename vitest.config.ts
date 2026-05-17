import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'shopify-widget/tests/**/*.test.ts', 'shopify-widget/src/**/*.test.ts'],
  },
});
