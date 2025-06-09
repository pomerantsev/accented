import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  publicDir: './public',
  markdown: {},
  vite: {
    build: {
      rollupOptions: {
        // In production, don't bundle Accented (it's not used anyway)
        external: ['accented']
      }
    },
  }
});
