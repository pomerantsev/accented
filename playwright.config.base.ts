import { defineConfig, devices, type Project } from '@playwright/test';

/**
 * Shared Playwright setup for the packages that have end-to-end tests
 * (devapp, playground, website).
 *
 * Each package keeps its own playwright.config.ts with the parts that genuinely differ
 * (the dev server it runs against and the browser projects it needs),
 * and gets everything else from here.
 *
 * Paths below are relative to the config file that calls createPlaywrightConfig,
 * not to this file, so every package gets its own test and output directories.
 */

type Options = {
  /** Port the package's dev server listens on. */
  port: number;

  /** Command that starts the dev server, run from the package directory. */
  webServerCommand: string;

  projects: Array<Project>;
};

/** The browsers we test against unless a package needs something more specific. */
export const desktopBrowserProjects: Array<Project> = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },

  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },

  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export function createPlaywrightConfig({ port, webServerCommand, projects }: Options) {
  const baseURL = `http://localhost:${port}`;

  return defineConfig({
    testDir: './test',
    outputDir: './playwright/test-results',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    /* TEMPORARY: retries disabled to diagnose the CI hangs that started on 2026-09-24.
       Retrying is what enables `trace: 'on-first-retry'` below, and a trace with snapshots
       never settles on an unresponsive page (microsoft/playwright#42903) — not even the test
       timeout interrupts it, which is why the jobs go silent instead of failing. Without a
       retry, the failure from the first attempt gets reported. Revert once diagnosed. */
    retries: 0,
    /* Opt out of parallel tests on CI.
       I tried using 2 or 4 workers, but that leads to many flakes,
       without any noticeable gain in speed. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [['html', { outputFolder: './playwright/report' }]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
      /* Base URL to use in actions like `await page.goto('/')`. */
      baseURL,

      /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
      trace: 'on-first-retry',

      screenshot: 'only-on-failure',

      video: 'retain-on-failure',
    },

    projects,

    /* Run your local dev server before starting the tests */
    webServer: {
      command: webServerCommand,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
    },
  });
}
