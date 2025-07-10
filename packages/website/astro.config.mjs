import mdx from '@astrojs/mdx';
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
  integrations: [mdx()],
  vite: {
    build: {
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
