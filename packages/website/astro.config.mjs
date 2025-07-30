import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import { rehypeWrapCodeBlocks } from './plugins/rehype-wrap-code-blocks.mjs';
import { rehypeWrapHeadings } from './plugins/rehype-wrap-headings.mjs';
import { theme } from './src/components/starterCodeUtils';

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  publicDir: './public',
  site: 'https://accented.dev',
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
  integrations: [
    mdx({
      rehypePlugins: [
        rehypeSlug, // Ensure IDs are added first
        rehypeWrapHeadings, // Then wrap with anchors
        rehypeWrapCodeBlocks, // Wrap code blocks in custom element
      ],
    }),
    sitemap(),
  ],
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
