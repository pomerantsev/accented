import type { Page } from '@playwright/test';
import { getTrigger } from './trigger';

export async function openAccentedDialog(page: Page, selector: string) {
  const elementWithIssues = await page.locator(selector);
  const trigger = await getTrigger(page, elementWithIssues);
  await trigger.click();
  return await page.getByRole('dialog', { name: 'Issues' });
}
