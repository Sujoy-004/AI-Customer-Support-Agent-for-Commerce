import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  testMatch: 'domSnapshot.spec.ts',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'node dev-server.mjs',
    port: 3000,
    timeout: 10000,
    reuseExistingServer: true,
  },
});
