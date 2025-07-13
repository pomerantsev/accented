import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { theme } from './src/components/starterCodeUtils';

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  publicDir: './public',
  site: 'https://www.accented.dev',
  trailingSlash: 'never',
  image: {
    responsiveStyles: true,
  },
  markdown: {
    shikiConfig: {
      theme,
      wrap: true,
    },
  },
  integrations: [mdx(), sitemap()],
  vite: {
    build: {
      // We know that axe-core is larger than 500 KB,
      // so let's suppress the warning.
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        // In production, don't bundle Accented (it's not used anyway)
        external: ['accented'],
      },
    },
    server: {
      // Allow ngrok access (I’m using it to allow access for ChatGPT)
      allowedHosts: ['.accented.dev', 'localhost', '.ngrok-free.app'],
    },
  },
});
