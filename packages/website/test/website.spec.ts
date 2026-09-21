import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { readClipboard } from './helpers/clipboard';
import { getPageUrls, getPageUrlsWithTableOfContents } from './helpers/pages';

test.describe('Home page', () => {
  test('renders the site title and main heading', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Accented');
    await expect(page.getByRole('heading', { level: 1, name: 'Accented' })).toBeVisible();
  });
});

test.describe('Analytics', () => {
  test('reports page performance metrics', async ({ page, browserName }) => {
    await page.goto('/');

    // Fails the test if the metrics are never sent.
    const beacon = page.waitForRequest('**/_actions/collectMetrics');
    // Largest Contentful Paint is only reported once the visitor interacts with the page.
    await page.getByRole('heading', { level: 1 }).click();
    const request = await beacon;

    if (browserName !== 'webkit') {
      // WebKit doesn't expose sendBeacon payloads to Playwright, so only the other
      // browsers can check what's being sent.
      expect(request.postDataJSON()).toMatchObject({
        lcp: expect.any(Number),
        commitSha: expect.any(String),
      });
    }
  });
});

test.describe('Every page', () => {
  // Pages have been served as 500s without anyone noticing (see https://github.com/pomerantsev/accented/pull/561),
  // so every page gets opened here. The assertions are deliberately generic:
  // they hold for any page, and don't need updating when content changes.

  for (const url of getPageUrls()) {
    test(`${url} opens`, async ({ page }) => {
      const response = await page.goto(url);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/Accented$/);

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toHaveCount(1);
      await expect(heading).not.toBeEmpty();
    });
  }

  test('an unknown URL renders the 404 page', async ({ page }) => {
    const response = await page.goto('/no-such-page');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Table of contents', () => {
  // The component collects the page's headings itself, so it can end up empty
  // while the page still renders fine.

  for (const url of getPageUrlsWithTableOfContents()) {
    test(`${url} lists its headings`, async ({ page }) => {
      await page.goto(url);

      const tableOfContents = page.getByRole('navigation', { name: 'Table of contents' });

      await expect(tableOfContents.getByRole('link').first()).toBeVisible();
    });
  }
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
