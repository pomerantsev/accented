import { test, expect } from '@playwright/test';
import { countLongTasks } from './utils/long-tasks';

const url = 'http://localhost:5173';

const accentedSelector = '[data-accented]';

test.describe('Accented', () => {
  test.describe('basic functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(url);
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
        const buttonWithIssue = page.getByRole('button').and(page.locator(accentedSelector));
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

  // 2025.01.04: these tests will currently not do anything in Safari and Firefox
  // because they don't support the longtask PerformanceObserver entry type.
  // We could potentially use mark and measure that work in all browsers,
  // but testing this only in Chromium is probably good enough for now.
  test.describe('performance', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${url}?disable`);
    });

    test('does not cause long tasks with few elements', async ({ page }) => {
      const longTasks = countLongTasks(page);
      if (!(await longTasks.supported())) {
        return;
      }
      await longTasks.start();
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      const longTaskCount = await longTasks.getCount();
      await expect(longTaskCount).toBe(0);
    });

    test('does not cause a long task when one element with an issue is added', async ({ page }) => {
      const longTasks = countLongTasks(page);
      if (!(await longTasks.supported())) {
        return;
      }
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await longTasks.start();
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      const longTaskCount = await longTasks.getCount();
      await expect(longTaskCount).toBe(0);
    });

    test('causes long tasks with many elements with issues', async ({ page }) => {
      const longTasks = countLongTasks(page);
      if (!(await longTasks.supported())) {
        return;
      }
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await longTasks.start();
      await page.getByRole('button', { name: 'Add many elements with issues' }).click();
      const longTaskCount = await longTasks.getCount();
      await expect(longTaskCount).toBeGreaterThan(0);
    });

    // This behavior should eventually be fixed, but for now, it's a known issue.
    test('causes long tasks when one element is added to many elements with issues', async ({ page }) => {
      const longTasks = countLongTasks(page);
      if (!(await longTasks.supported())) {
        return;
      }
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.getByRole('button', { name: 'Add many elements with issues' }).click();
      await longTasks.start();
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      const longTaskCount = await longTasks.getCount();
      await expect(longTaskCount).toBeGreaterThan(0);
    });

    test('causes long tasks with many elements with no issues', async ({ page }) => {
      const longTasks = countLongTasks(page);
      if (!(await longTasks.supported())) {
        return;
      }
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await longTasks.start();
      await page.getByRole('button', { name: 'Add many elements with no issues' }).click();
      const longTaskCount = await longTasks.getCount();
      await expect(longTaskCount).toBeGreaterThan(0);
    });

    // This behavior should eventually be fixed, but for now, it's a known issue.
    test('causes long tasks when one element is added to many elements with no issues', async ({ page }) => {
      const longTasks = countLongTasks(page);
      if (!(await longTasks.supported())) {
        return;
      }
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.getByRole('button', { name: 'Add many elements with no issues' }).click();
      await longTasks.start();
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      const longTaskCount = await longTasks.getCount();
      await expect(longTaskCount).toBeGreaterThan(0);
    });
  });
});
