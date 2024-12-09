import { test, expect } from '@playwright/test';

const url = 'http://localhost:5173';

test('has a primary heading', async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'Accented blah' })).toBeVisible();
});
