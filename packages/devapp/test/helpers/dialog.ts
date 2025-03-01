import type { Page } from '@playwright/test';
import { getTriggerContainer, getTrigger } from './trigger';

export async function openAccentedDialog(page: Page, selector: string) {
  const elementWithIssues = await page.locator(selector);
  const triggerContainer = await getTriggerContainer(page, elementWithIssues);
  const trigger = await getTrigger(triggerContainer);
  await trigger.click();
  return await page.getByRole('dialog', { name: 'Issues' });
}
