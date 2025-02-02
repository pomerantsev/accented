import { test, expect } from '@playwright/test';
const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;

test.describe('Accented', () => {

  test.describe('rendering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('triggers are rendered in the correct positions', async ({ page }) => {
      const nodes = await page.locator(accentedSelector).elementHandles();
      for (const node of nodes) {
        const elementPosition = await node.evaluate(n => {
          const rect = (n as Element).getBoundingClientRect();
          return { top: rect.top, right: rect.right };
        });
        const id = await node.getAttribute(accentedDataAttr);
        const triggerContainer = await page.locator(`accented-trigger[data-id="${id}"]`);
        const trigger = await triggerContainer.locator('#trigger');
        const triggerPosition = await trigger.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return { top: rect.top, right: rect.right };
        });
        console.log(node.toString());
        // We check for approximate equality because some browsers may not line the elements up precisely.
        expect(elementPosition.right).toBeGreaterThan(triggerPosition.right - 1);
        expect(elementPosition.right).toBeLessThan(triggerPosition.right + 1);
        expect(elementPosition.top).toBeGreaterThan(triggerPosition.top - 1);
        expect(elementPosition.top).toBeLessThan(triggerPosition.top + 1);
      }
    });
  });
});
