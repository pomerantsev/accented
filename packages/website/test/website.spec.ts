import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('renders the site title and main heading', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Accented');
    await expect(page.getByRole('heading', { level: 1, name: 'Accented' })).toBeVisible();
  });
});
