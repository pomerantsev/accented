import { expect, test } from '@playwright/test';
import { readClipboard } from './helpers/clipboard';

test.describe('Home page', () => {
  test('renders the site title and main heading', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Accented');
    await expect(page.getByRole('heading', { level: 1, name: 'Accented' })).toBeVisible();
  });
});

test.describe('Documentation pages', () => {
  // The markdown pipeline wraps heading contents in a link to the heading itself,
  // and wraps code blocks in a <copy-code> element that adds a copy button.
  // Both silently disappeared once before (see #591), so these tests guard against that.

  test.beforeEach(async ({ page }) => {
    await page.goto('/getting-started');
  });

  test('headings link to themselves', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 2, name: 'First steps' });
    const link = heading.getByRole('link', { name: 'First steps' });

    await link.click();

    await expect(page).toHaveURL('/getting-started#first-steps');
  });

  test('code blocks can be copied to the clipboard', async ({ page, context, browserName }) => {
    // Chromium only allows navigator.clipboard.writeText with an explicit permission.
    // Firefox and WebKit allow it from a user gesture, and Playwright rejects the
    // permission name as unknown for them.
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-write']);
    }

    const mainContent = page.getByRole('main');
    const codeBlockWrappers = mainContent.getByRole('group', { name: 'Code block' });

    // Every code block is wrapped, not just the one that the StarterCode component
    // wraps by hand — that one survives even when the markdown pipeline stops wrapping.
    await expect(codeBlockWrappers).toHaveCount(await mainContent.locator('pre').count());

    const firstCodeBlockWrapper = codeBlockWrappers.first();

    const code = (await firstCodeBlockWrapper.locator('pre').textContent())?.trim();

    // Located by role alone: the button's accessible name changes when it's clicked.
    const copyButton = firstCodeBlockWrapper.getByRole('button');
    await copyButton.click();
    await expect(copyButton).toHaveText('✓ Copied!');

    expect(await readClipboard(page)).toBe(code);
  });
});
