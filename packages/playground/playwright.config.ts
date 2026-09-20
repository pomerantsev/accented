import { createPlaywrightConfig, desktopBrowserProjects } from '../../playwright.config.base';

export default createPlaywrightConfig({
  port: 5173,
  webServerCommand: 'pnpm dev',
  projects: desktopBrowserProjects,
});
