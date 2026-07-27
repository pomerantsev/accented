import netlifyImageService from '@astrojs/netlify/image-service.js';
import type { ExternalImageService } from 'astro';
import { isESMImportedImage } from 'astro/assets/utils';

/**
 * Because we deploy to Netlify, the Netlify adapter swaps in its own image
 * service (Netlify Image CDN) in place of Astro's built-in Sharp service.
 * Unlike the Sharp service, it does NOT default the output format, so images
 * are served in their original (usually PNG) format unless `format` is set
 * explicitly on every `<Image>`.
 *
 * This thin wrapper defaults every image to WebP so we don't have to repeat
 * `format="webp"` on each component. Pass an explicit `format` on an
 * individual `<Image>` to override it. SVG sources are left untouched.
 */
const service: ExternalImageService = {
  ...netlifyImageService,
  validateOptions(options, imageConfig) {
    const isSvgSource = isESMImportedImage(options.src) && options.src.format === 'svg';
    if (!isSvgSource) {
      options.format ??= 'webp';
    }
    return netlifyImageService.validateOptions!(options, imageConfig);
  },
};

// biome-ignore lint/style/noDefaultExport: Astro resolves an image service via its default export.
export default service;
