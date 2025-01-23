import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;
const accentedContainerElementName = 'accented-container';

const supportsAnchorPositioning = async (page: Page) =>
  await page.evaluate(() => CSS.supports('anchor-name: --foo') && CSS.supports('position-anchor: --foo'));

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

      test('adds its attributes to elements, and adds triggers in supporting browsers', async ({ page }) => {
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBeGreaterThan(0);

        const triggerCount = await page.locator(accentedContainerElementName).count();
        if (await supportsAnchorPositioning(page)) {
          await expect(triggerCount).toBe(count);
        } else {
          await expect(triggerCount).toBe(0);
        }
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

      test('Accented-specific attributes and triggers are removed', async ({ page }) => {
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBe(0);

        const triggerCount = await page.locator(accentedContainerElementName).count();
        expect(triggerCount).toBe(0);
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
      const finalTriggerCount = await page.locator(accentedContainerElementName).count();
      expect(finalCount).toBe(initialCount + 1);
      if (await supportsAnchorPositioning(page)) {
        expect(finalTriggerCount).toBe(finalCount);
      } else {
        expect(finalTriggerCount).toBe(0);
      }
    });

    test('removing an element with an issue results in one fewer elements with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Remove button' });
      await button.click();
      const finalCount = await page.locator(accentedSelector).count();
      const finalTriggerCount = await page.locator(accentedContainerElementName).count();
      expect(finalCount).toBe(initialCount - 1);
      if (await supportsAnchorPositioning(page)) {
        expect(finalTriggerCount).toBe(finalCount);
      } else {
        expect(finalTriggerCount).toBe(0);
      }
    });

    test('removing an issue from an element with one issue results in one fewer elements with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Add text to button' });
      await button.click();
      const finalCount = await page.locator(accentedSelector).count();
      const finalTriggerCount = await page.locator(accentedContainerElementName).count();
      expect(finalCount).toBe(initialCount - 1);
      if (await supportsAnchorPositioning(page)) {
        expect(finalTriggerCount).toBe(finalCount);
      } else {
        expect(finalTriggerCount).toBe(0);
      }
    });
  });

  test.describe('rendering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('triggers are rendered in the correct positions', async ({ page }) => {
      if (!(await supportsAnchorPositioning(page))) {
        return;
      }
      const nodes = await page.locator(accentedSelector).elementHandles();
      for (const node of nodes) {
        const elementPosition = await node.evaluate(n => {
          const rect = (n as Element).getBoundingClientRect();
          return { bottom: rect.bottom, right: rect.right };
        });
        const id = await node.getAttribute(accentedDataAttr);
        const trigger = await page.locator(`accented-container[data-id="${id}"]`);
        const triggerPosition = await trigger.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return { bottom: rect.bottom, right: rect.right };
        });
        expect(elementPosition.right).toBe(triggerPosition.right);
        expect(elementPosition.bottom).toBe(triggerPosition.bottom);
      }
    });

    test('triggers are rendered in the correct positions for right-to-left writing mode', async ({ page }) => {
      if (!(await supportsAnchorPositioning(page))) {
        return;
      }
      await page.getByRole('button', { name: 'Toggle text direction' }).click();
      const nodes = await page.locator(accentedSelector).elementHandles();
      for (const node of nodes) {
        const elementPosition = await node.evaluate(n => {
          const rect = (n as Element).getBoundingClientRect();
          return { bottom: rect.bottom, left: rect.left };
        });
        const id = await node.getAttribute(accentedDataAttr);
        const trigger = await page.locator(`accented-container[data-id="${id}"]`);
        const triggerPosition = await trigger.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return { bottom: rect.bottom, left: rect.left };
        });
        expect(elementPosition.left).toBe(triggerPosition.left);
        expect(elementPosition.bottom).toBe(triggerPosition.bottom);
      }
    });

    test('outlines with certain properties are added to elements', async ({ page }) => {
      const buttonWithIssue = await page.getByRole('button').and(page.locator(accentedSelector)).first();
      const [outlineColor, outlineWidth, outlineOffset] = await buttonWithIssue.evaluate(buttonElement => {
        const computedStyle = window.getComputedStyle(buttonElement)
        return [
          computedStyle.getPropertyValue('outline-color'),
          computedStyle.getPropertyValue('outline-width'),
          computedStyle.getPropertyValue('outline-offset')
        ];
      });
      await expect(outlineColor).toBe('rgb(255, 0, 0)');
      await expect(outlineWidth).toBe('2px');
      await expect(outlineOffset).toBe('-2px');
    });

    test('outlines change color if certain CSS props are set', async ({ page }) => {
      await page.goto('?name=green-accented');
      const buttonWithIssue = await page.getByRole('button').and(page.locator('[data-green-accented]')).first();
      const outlineColor = await buttonWithIssue.evaluate(buttonElement => {
        const computedStyle = window.getComputedStyle(buttonElement)
        return computedStyle.getPropertyValue('outline-color');
      });
      await expect(outlineColor).toBe('rgb(0, 128, 0)');
    });

    test('trigger is interactable if the element with issues has a z-index', async ({ page }) => {
      const buttonWithIssue = await page.locator('#z-index-button');
      const id = await buttonWithIssue.getAttribute(accentedDataAttr);
      const trigger = await page.locator(`accented-container[data-id="${id}"]`);
      if ((await supportsAnchorPositioning(page))) {
        await trigger.click();
      } else {
        await expect(trigger).not.toBeAttached();
      }
    });

    test('a trigger is added for issues in the <html> element', async ({ page }) => {
      const html = await page.locator('html');
      const id = await html.getAttribute(accentedDataAttr);
      const trigger = await page.locator(`accented-container[data-id="${id}"]`);
      if ((await supportsAnchorPositioning(page))) {
        await expect(trigger).toBeVisible();
      } else {
        await expect(trigger).not.toBeAttached();
      }
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
