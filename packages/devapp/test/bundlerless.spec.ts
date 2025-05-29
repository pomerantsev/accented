import { expect } from '@playwright/test';
import { test } from './fixtures/test';

const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;

// This test suite runs both on pushes and on a schedule
test.describe('Bundlerless importing of Accented', () => {
  test('adds its attributes to elements and doesn’t produce any console errors', async ({
    page,
  }) => {
    const allMessages = [];
    const errors = [];
    page.on('console', (message) => {
      allMessages.push(message);
      if (message.type() === 'error') {
        errors.push(message);
      }
    });
    await page.goto('/bundlerless.html');
    const elementWithIssue = await page.locator(accentedSelector);
    await expect(elementWithIssue).toBeVisible();
    await expect(allMessages.length).toBeGreaterThan(0);
    await expect(errors.length).toBe(0);
  });
});
