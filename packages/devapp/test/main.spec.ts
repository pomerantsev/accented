import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;

test.describe('Accented', () => {
  test.describe('basic functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test.describe('when enabled', () => {
      test('adds an Accented-specific stylesheet to the document', async ({ page }) => {
        const adoptedStyleSheets = await page.evaluate(() => document.adoptedStyleSheets);
        await expect(adoptedStyleSheets).toHaveLength(1);
      });

      test('adds its attributes to elements', async ({ page }) => {
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBeGreaterThan(0);
      });

      test('adds outlines with certain properties to elements', async ({ page }) => {
        const buttonWithIssue = await page.getByRole('button').and(page.locator(accentedSelector)).first();
        const [outlineWidth, outlineOffset] = await buttonWithIssue.evaluate(buttonElement => {
          const computedStyle = window.getComputedStyle(buttonElement)
          return [
            computedStyle.getPropertyValue('outline-width'),
            computedStyle.getPropertyValue('outline-offset')
          ];
        });
        await expect(outlineWidth).toBe('2px');
        await expect(outlineOffset).toBe('-2px');
      });
    });

    test.describe('when disabled', () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole('button', { name: 'Toggle Accented' }).click();
      });

      test('removes the Accented-specific stylesheet from the document', async ({ page }) => {
        const adoptedStyleSheets = await page.evaluate(() => document.adoptedStyleSheets);
        await expect(adoptedStyleSheets).toHaveLength(0);
      });

      test('Accented-specific attributes are removed', async ({ page }) => {
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBe(0);
      });

      test('can be successfully re-enabled', async ({ page }) => {
        await page.getByRole('button', { name: 'Toggle Accented' }).click();
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBeGreaterThan(0);
      });
    });
  });

  test.describe('mutations', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('?no-console&callback&throttle-wait=0');
    });

    test('adding an element with an issue results in one more element with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Add one element with an issue' });
      await button.click();
      const newButton1 = await page.getByRole('button', { name: 'Button 1' });
      await expect(newButton1).toHaveAttribute(accentedDataAttr);
      const finalCount = await page.locator(accentedSelector).count();
      expect(finalCount).toBe(initialCount + 1);
    });

    test('removing an element with an issue results in one fewer elements with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Remove button' });
      await button.click();
      const finalCount = await page.locator(accentedSelector).count();
      expect(finalCount).toBe(initialCount - 1);
    });

    test('removing an issue from an element with one issue results in one fewer elements with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Add text to button' });
      await button.click();
      const finalCount = await page.locator(accentedSelector).count();
      expect(finalCount).toBe(initialCount - 1);
    });
  });

  test.describe('mutation observer', () => {
    test('causes a single scan when the mutation list consists of more than one event', async ({ page }) => {
      await page.goto(`?no-console&callback&throttle-wait=0`);
      // Wait for the first console message
      await page.waitForEvent('console');

      let messageCount = 0;
      page.on('console', () => {
        messageCount++;
      });
      await page.getByRole('button', { name: 'Add two elements with issues' }).click();
      await page.waitForTimeout(200);
      await expect(messageCount).toBe(1);
    });
  });

  test.describe('API', () => {
    test('callback', async ({ page }) => {
      await page.goto(`?callback&no-console`);
      const consoleMessage = await page.waitForEvent('console');
      const arg1 = await consoleMessage.args()[0]?.jsonValue();
      await expect(arg1).toEqual('Elements from callback:');
    });

    test('name', async ({ page }) => {
      await page.goto(`?name=my-name`);
      const count = await page.locator('[data-my-name]').count();
      await expect(count).toBeGreaterThan(0);
    });

    test.describe('throttle', () => {
      test('leading: false', async ({ page }) => {
        await page.goto(`?throttle-wait=100&no-leading`);
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBe(0);
        await page.waitForTimeout(250);
        const countAfter = await page.locator(accentedSelector).count();
        await expect(countAfter).toBeGreaterThan(0);
      });

      test('adding new elements with leading: true', async ({ page }) => {
        await page.goto(`?throttle-wait=300`);
        await page.waitForTimeout(350);
        const button = await page.getByRole('button', { name: 'Add one element with an issue' });
        await button.click();
        await button.click();
        const newButton1 = await page.getByRole('button', { name: 'Button 1' });
        const newButton2 = await page.getByRole('button', { name: 'Button 2' });
        await expect(newButton1).toHaveAttribute(accentedDataAttr);
        await expect(newButton2).not.toHaveAttribute(accentedDataAttr, { timeout: 50 });
        await page.waitForTimeout(350);
        await expect(newButton1).toHaveAttribute(accentedDataAttr);
        await expect(newButton2).toHaveAttribute(accentedDataAttr);
      });

      test('adding new elements with leading: false', async ({ page }) => {
        await page.goto(`?throttle-wait=300&no-leading`);
        await page.waitForTimeout(350);
        const button = await page.getByRole('button', { name: 'Add one element with an issue' });
        await button.click();
        await button.click();
        const newButton1 = await page.getByRole('button', { name: 'Button 1' });
        const newButton2 = await page.getByRole('button', { name: 'Button 2' });
        await expect(newButton1).not.toHaveAttribute(accentedDataAttr, { timeout: 50 });
        await expect(newButton2).not.toHaveAttribute(accentedDataAttr, { timeout: 50 });
        await page.waitForTimeout(350);
        await expect(newButton1).toHaveAttribute(accentedDataAttr);
        await expect(newButton2).toHaveAttribute(accentedDataAttr);
      });
    });
  });

  // 2025.01.04: these tests will currently not do anything in Safari and Firefox
  // because they don't support the longtask PerformanceObserver entry type.
  // We could potentially use mark and measure that work in all browsers,
  // but testing this only in Chromium is probably good enough for now.
  test.describe('performance', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`?disable&no-console&duration&throttle-wait=100&no-leading`);
    });

    async function expectShortScan(page: Page) {
      const consoleMessage = await page.waitForEvent('console');
      const duration = parseInt(await consoleMessage.args()[1]?.jsonValue(), 10);
      await expect(duration).toBeLessThan(150);
    }

    async function expectLongScan(page: Page) {
      const consoleMessage = await page.waitForEvent('console');
      const duration = parseInt(await consoleMessage.args()[1]?.jsonValue(), 10);
      await expect(duration).toBeGreaterThan(150);
    }

    test('does not take long to run with few elements', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await expectShortScan(page);
    });

    test('does not take long to run when one element with an issue is added', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      await expectShortScan(page);
    });

    test('takes long to run with many elements with issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with issues' }).click();
      await expectLongScan(page);
    });

    // This behavior should eventually be fixed, but for now, it's a known issue.
    test('causes long tasks when one element is added to many elements with issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with issues' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      await expectLongScan(page);
    });

    test('causes long tasks with many elements with no issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with no issues' }).click();
      await expectLongScan(page);
    });

    // This behavior should eventually be fixed, but for now, it's a known issue.
    test('causes long tasks when one element is added to many elements with no issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with no issues' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      await expectLongScan(page);
    });
  });
});
