import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ expectErrors: (expectedCount: number) => void }>({
  expectErrors: [
    async ({ page }, use) => {
      let errorCount = 0;
      let expectedErrorCount = 0;

      const setExpectedErrors = (count: number) => {
        expectedErrorCount = count;
      };

      page.on('pageerror', () => {
        errorCount++;
      });

      await use(setExpectedErrors);

      expect(errorCount).toBe(expectedErrorCount);
    },
    { auto: true },
  ],
});
