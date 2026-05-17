import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    lib: {
      entry: resolve(__dirname, 'src/shopify-widget/src/ChatWidget.js'),
      name: 'ChatWidget',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        exports: 'default',
        entryFileNames: 'widget.js',
      },
    },
  },
});
