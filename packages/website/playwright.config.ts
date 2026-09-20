import { createPlaywrightConfig, desktopBrowserProjects } from '../../playwright.config.base';

export default createPlaywrightConfig({
  port: 4321,
  /* `pnpm dev` runs `netlify dev`, which needs a Netlify login and a linked database,
     so the tests run against a plain Astro dev server instead.
     Everything these tests cover (markup, client-side JS, Astro actions)
     behaves the same either way. */
  webServerCommand: 'pnpm dev:astro',
  projects: desktopBrowserProjects,
});
