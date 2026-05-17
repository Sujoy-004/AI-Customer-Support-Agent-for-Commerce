// e2e/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx tsc -p tsconfig.widget.json && npx vite build --config shopify-widget/vite.config.ts && npx serve shopify-widget -l 3000 --no-clipboard',
    port: 3000,
    timeout: 60000,
    reuseExistingServer: false,
    cwd: '..',
  },
});
