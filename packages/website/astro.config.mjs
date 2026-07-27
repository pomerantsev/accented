import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeSlug from 'rehype-slug';
import { rehypeWrapCodeBlocks } from './plugins/rehype-wrap-code-blocks.mjs';
import { rehypeWrapHeadings } from './plugins/rehype-wrap-headings.mjs';
import { theme } from './src/components/starterCodeUtils';

const commitSha = execSync('git rev-parse HEAD').toString().trim();

// Absolute path to our custom image service (see the file for why it exists).
const webpImageServiceEntrypoint = fileURLToPath(
  new URL('./src/webp-netlify-image-service.ts', import.meta.url),
);

// The Netlify adapter forcibly sets `image.service.entrypoint` to its own
// service during `astro:config:setup`. Adapter hooks run before the
// integrations listed below, so this integration's `updateConfig` runs last
// and wins, pointing the image service at our WebP-defaulting wrapper.
const defaultToWebpImages = {
  name: 'default-to-webp-images',
  hooks: {
    'astro:config:setup': ({ updateConfig }) => {
      updateConfig({
        image: {
          service: { entrypoint: webpImageServiceEntrypoint },
        },
      });
    },
  },
};

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  publicDir: './public',
  site: 'https://accented.dev',
  trailingSlash: 'never',
  output: 'server',

  build: {
    format: 'file',
  },

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
    defaultToWebpImages,
  ],

  vite: {
    define: {
      // We can use the commit SHA if / when we collect metrics / error reports,
      // to determine what version of the site those originated from.
      'import.meta.env.COMMIT_SHA': `"${commitSha}"`,
    },
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

  adapter: netlify(),

  security: {
    checkOrigin: false,
  },
});
