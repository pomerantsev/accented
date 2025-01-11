import { test, expect } from '@playwright/test';

const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;

// This test suite runs both on pushes and on a schedule
test.describe('JSDelivr version of Accented', () => {
  test('adds its attributes to elements and doesn’t produce any console errors', async ({ page, browserName }) => {
    const allMessages = [];
    const errors = [];
    page.on('console', message => {
      allMessages.push(message);
      if (message.type() === 'error') {
        errors.push(message);
      }
    });
    await page.goto('/jsdelivr.html');
    const elementWithIssue = await page.locator(accentedSelector);
    await expect(elementWithIssue).toBeVisible();
    await expect(allMessages.length).toBeGreaterThan(0);

    // TODO: Determine why Safari throws a console error
    if (browserName !== 'webkit') {
      await expect(errors.length).toBe(0);
    }
  });
});
