import { test, expect } from '@playwright/test';

const url = 'http://localhost:5173';

const accentedSelector = '[data-accented]';

test.describe('Accented', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url);
  });

  test.describe('basic functionality', () => {
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
    });
  });
});
