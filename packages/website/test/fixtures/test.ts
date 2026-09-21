import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // The analytics action writes to a database that the tests don't have,
    // so every page view would otherwise fill the output with connection errors.
    await page.route('**/_actions/**', (route) => route.fulfill({ status: 204 }));

    await use(page);
  },
});
