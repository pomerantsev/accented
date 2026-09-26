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
    retries: process.env.CI ? 2 : 0,
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

      /**
       * Stop the dev server with SIGTERM instead of Playwright's default SIGKILL.
       *
       * Every command above is a pnpm script, and since pnpm 12.6.0 a script pnpm runs
       * without a terminal gets a process group of its own (pnpm/pnpm#15555). Playwright
       * tears the server down by signalling the group it spawned — pnpm's group, not the
       * script's. SIGKILL can't be caught, so pnpm dies instantly and the dev server lives
       * on, holding the stdout/stderr pipes Playwright is waiting to see closed. Playwright
       * then waits on a "close" event that can never arrive, and because no test is running
       * at that point, no test timeout applies: the run hangs after its last test until the
       * CI job hits its own limit. SIGTERM avoids all of this, because pnpm can catch it and
       * pass it on to the script's group.
       *
       * pnpm 12.7.0 fixes the underlying bug, but this stays regardless: it costs nothing,
       * and it keeps a future pnpm from being able to hang the suite the same way.
       *
       * Expect one bit of noise wherever Playwright owns the server — always in CI, and
       * locally only when no dev server is already running for it to reuse:
       *
       *   [WebServer] [ELIFECYCLE] Command failed with exit code 143.
       *
       * That is pnpm reporting the SIGTERM it was just asked to deliver (143 = 128 + 15).
       * It is not a failure; the run still exits 0.
       *
       * The signal is what matters here; `timeout` is required by the type and only bounds
       * how long Playwright waits for the server to close before falling back to SIGKILL.
       * Five seconds is arbitrary — the server has closed in about 10ms every time.
       */
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    },
  });
}
