import type { Page, Locator } from '@playwright/test';
import { getTriggerContainer, getTrigger } from './trigger';

export async function openAccentedDialog(page: Page, element: string | Locator) {
  const elementWithIssues = typeof element === 'string' ? await page.locator(element) : element;
  const triggerContainer = await getTriggerContainer(page, elementWithIssues);
  const trigger = await getTrigger(triggerContainer);
  await trigger.click();
  return await page.getByRole('dialog', { name: 'Issues' });
}
