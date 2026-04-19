import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { openAccentedDialog } from './helpers/dialog';

/**
 * These tests verify our understanding of axe-core's rule configuration API
 * (runOnly, rules). They don't test Accented-specific behavior — if they ever
 * fail, it means axe-core changed how it applies these options, and our internal
 * rule-handling logic needs to be revisited.
 *
 * All tests scope the axe run to #axe-rule-logic so that violations from the
 * rest of the page don't interfere with counts.
 */

// # must be percent-encoded so URLSearchParams doesn't treat it as a fragment.
const contextParam = 'axe-context-selector=%23axe-rule-logic';
const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;
const sectionName = 'Axe-core rule logic verification';

test.describe('axe-core rule configuration', () => {
  test.describe('runOnly + rules interaction', () => {
    test('with runOnly restricted to best-practice tags, color-contrast violations are not reported', async ({
      page,
    }) => {
      await page.goto(`?${contextParam}&run-only-tags=best-practice`);
      const section = page.getByRole('region', { name: sectionName });
      await expect(section.locator(accentedSelector)).toHaveCount(0);
    });

    test('with runOnly restricted to best-practice tags and color-contrast re-enabled via rules, color-contrast violations are reported', async ({
      page,
    }) => {
      await page.goto(`?${contextParam}&run-only-tags=best-practice&enable-rules=color-contrast`);
      const section = page.getByRole('region', { name: sectionName });
      const violatingElement = section.locator(accentedSelector);
      await expect(violatingElement).toHaveCount(1);
      await openAccentedDialog(page, violatingElement);
      await expect(page.getByRole('link', { name: /contrast/i })).toBeVisible();
    });

    test('with runOnly restricted to color-contrast rule ID, color-contrast violations are reported', async ({
      page,
    }) => {
      await page.goto(`?${contextParam}&run-only-rules=color-contrast`);
      const section = page.getByRole('region', { name: sectionName });
      const violatingElement = section.locator(accentedSelector);
      await expect(violatingElement).toHaveCount(1);
      await openAccentedDialog(page, violatingElement);
      await expect(page.getByRole('link', { name: /contrast/i })).toBeVisible();
    });

    test('with runOnly restricted to color-contrast rule ID and color-contrast disabled via rules, color-contrast violations are still reported (rules is ignored when runOnly type is rule)', async ({
      page,
    }) => {
      await page.goto(
        `?${contextParam}&run-only-rules=color-contrast&disable-rules=color-contrast`,
      );
      const section = page.getByRole('region', { name: sectionName });
      await expect(section.locator(accentedSelector)).toHaveCount(1);
    });

    test('with runOnly restricted to a different rule ID and color-contrast re-enabled via rules, color-contrast violations are not reported (rules is ignored when runOnly type is rule)', async ({
      page,
    }) => {
      await page.goto(`?${contextParam}&run-only-rules=button-name&enable-rules=color-contrast`);
      const section = page.getByRole('region', { name: sectionName });
      await expect(section.locator(accentedSelector)).toHaveCount(0);
    });

    test('with runOnly restricted to wcag2aa tags, color-contrast violations are reported', async ({
      page,
    }) => {
      await page.goto(`?${contextParam}&run-only-tags=wcag2aa`);
      const section = page.getByRole('region', { name: sectionName });
      const violatingElement = section.locator(accentedSelector);
      await expect(violatingElement).toHaveCount(1);
      await openAccentedDialog(page, violatingElement);
      await expect(page.getByRole('link', { name: /contrast/i })).toBeVisible();
    });

    test('with runOnly restricted to wcag2aa tags and color-contrast disabled via rules, color-contrast violations are not reported', async ({
      page,
    }) => {
      await page.goto(`?${contextParam}&run-only-tags=wcag2aa&disable-rules=color-contrast`);
      const section = page.getByRole('region', { name: sectionName });
      await expect(section.locator(accentedSelector)).toHaveCount(0);
    });
  });
});
