import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  server: {
    open: '/demo/index.html',
  },
  build: {
    outDir: 'dist',
  },
});
