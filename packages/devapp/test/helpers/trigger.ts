import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function getTriggerContainer(page: Page, locator: Locator) {
  const id = await locator.getAttribute('data-accented');
  return await page.locator(`accented-trigger[data-id="${id}"]`);
}

export async function getTrigger(triggerContainer: Locator) {
  return await triggerContainer.locator('#trigger');
}

export async function getTransform(element: Locator) {
  return await element.evaluate(el => {
    return window.getComputedStyle(el).transform;
  });
}

async function getBoundingClientRect(element: Locator) {
  return await element.evaluate(el => {
    return (el as Element).getBoundingClientRect();
  });
}

export async function expectElementAndTriggerToBeAligned(element: Locator, triggerContainer: Locator) {
  const elementRect = await getBoundingClientRect(element);
  const direction = await element.evaluate(el => window.getComputedStyle(el).direction);
  const side = direction === 'ltr' ? 'right' : 'left';
  const trigger = await getTrigger(triggerContainer);

  // For ease of testing, make the trigger button flush with the element's inline end and block start
  // (usually top right).
  await trigger.evaluate(el => {
    el.style.setProperty('inset-inline-end', '0');
    el.style.setProperty('inset-block-start', '0');
  });

  const triggerRect = await getBoundingClientRect(trigger);

  // We check for approximate equality because some browsers may not line the elements up precisely.
  expect(triggerRect[side]).toBeGreaterThan(elementRect[side] - 2);
  expect(triggerRect[side]).toBeLessThan(elementRect[side] + 2);
  expect(triggerRect.top).toBeGreaterThan(elementRect.top - 2);
  expect(triggerRect.top).toBeLessThan(elementRect.top + 2);

  const elementTransform = await getTransform(element);
  const triggerContainerTransform = await getTransform(triggerContainer);
  expect(elementTransform).toBe(triggerContainerTransform);
}
