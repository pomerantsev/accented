import { devices } from '@playwright/test';
import { createPlaywrightConfig } from '../../playwright.config.base';

export default createPlaywrightConfig({
  port: 5173,
  webServerCommand: 'pnpm dev',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      testIgnore: /axe-options/,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'chromium-dark',
      testMatch: /with-colors/,
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
    },

    {
      name: 'firefox',
      testIgnore: /axe-options/,
      use: { ...devices['Desktop Firefox'] },
    },

    // There's nothing special about Firefox for running the axe-options tests.
    // I could choose any one browser for them, and I chose Firefox.
    {
      name: 'firefox-axe-options',
      testMatch: /axe-options/,
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'firefox-dark',
      testMatch: /with-colors/,
      use: { ...devices['Desktop Firefox'], colorScheme: 'dark' },
    },

    {
      name: 'webkit',
      testIgnore: /axe-options/,
      use: { ...devices['Desktop Safari'] },
    },

    {
      name: 'webkit-dark',
      testMatch: /with-colors/,
      use: { ...devices['Desktop Safari'], colorScheme: 'dark' },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
