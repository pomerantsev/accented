import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function getTrigger(page: Page, locator: Locator) {
  const id = await locator.getAttribute('data-accented');
  const triggerContainer = await page.locator(`accented-trigger[data-id="${id}"]`);
  return await triggerContainer.locator('#trigger');
}

async function getBoundingClientRect(element: Locator) {
  return await element.evaluate(el => {
    return (el as Element).getBoundingClientRect();
  });
}

export async function expectElementAndTriggerToBeAligned(element: Locator, trigger: Locator) {
  const elementRect = await getBoundingClientRect(element);
  const direction = await element.evaluate(el => window.getComputedStyle(el).direction);
  const side = direction === 'ltr' ? 'right' : 'left';
  const triggerRect = await getBoundingClientRect(trigger);

  // We check for approximate equality because some browsers may not line the elements up precisely.
  expect(triggerRect[side]).toBeGreaterThan(elementRect[side] - 1);
  expect(triggerRect[side]).toBeLessThan(elementRect[side] + 1);
  expect(triggerRect.top).toBeGreaterThan(elementRect.top - 1);
  expect(triggerRect.top).toBeLessThan(elementRect.top + 1);
}
