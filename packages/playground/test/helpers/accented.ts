import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;
const accentedTriggerElementName = 'accented-trigger';

/**
 * Get an Accented trigger container for a specific element with issues.
 */
export async function getTriggerContainer(page: Page, element: Locator): Promise<Locator> {
  const id = await element.getAttribute(accentedDataAttr);
  return page.locator(`${accentedTriggerElementName}[data-id="${id}"]`);
}

/**
 * Get the trigger button inside a trigger container.
 */
export async function getTrigger(triggerContainer: Locator): Promise<Locator> {
  return triggerContainer.locator('#trigger');
}

/**
 * Open an Accented dialog for a specific element with issues.
 * Returns the dialog locator.
 */
export async function openAccentedDialog(page: Page, element: Locator): Promise<Locator> {
  const triggerContainer = await getTriggerContainer(page, element);
  const trigger = await getTrigger(triggerContainer);
  await trigger.click();
  return page.getByRole('dialog', { name: 'Issues' });
}

/**
 * Wait for Accented to initialize and find accessibility issues.
 * Returns the number of elements with issues found.
 */
export async function waitForAccentedToLoad(page: Page): Promise<number> {
  // Wait for at least one Accented trigger to appear
  await page.locator(accentedTriggerElementName).first().waitFor({ timeout: 10000 });

  // Return the total number of elements with issues
  return page.locator(accentedSelector).count();
}

/**
 * Get all elements that have accessibility issues detected by Accented.
 */
export function getElementsWithIssues(page: Page): Locator {
  return page.locator(accentedSelector);
}

/**
 * Get all Accented trigger buttons.
 */
export function getAccentedTriggers(page: Page): Locator {
  return page.locator(accentedTriggerElementName);
}

/**
 * Verify that a specific number of Accented triggers are visible.
 */
export async function expectAccentedTriggerCount(page: Page, expectedCount: number): Promise<void> {
  const triggers = getAccentedTriggers(page);
  const count = await triggers.count();
  expect(count).toBe(expectedCount);
}
