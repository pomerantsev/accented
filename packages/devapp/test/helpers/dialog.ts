import type { Locator, Page } from '@playwright/test';
import { getTrigger, getTriggerContainer } from './trigger';

export async function openAccentedDialog(page: Page, element: string | Locator) {
  const elementWithIssues = typeof element === 'string' ? await page.locator(element) : element;
  await elementWithIssues.scrollIntoViewIfNeeded();
  const triggerContainer = await getTriggerContainer(page, elementWithIssues);
  const trigger = await getTrigger(triggerContainer);
  await trigger.click();
  return await page.getByRole('dialog', { name: 'Issues' });
}
