import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import axe from 'axe-core';

const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;
const accentedTriggerElementName = 'accented-trigger';

const supportsAnchorPositioning = async (page: Page) =>
  await page.evaluate(() => CSS.supports('anchor-name: --foo') && CSS.supports('position-anchor: --foo'));

test.describe('Accented', () => {
  test.describe('basic functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test.describe('when enabled', () => {
      test('adds an Accented-specific stylesheet to the document', async ({ page }) => {
        const adoptedStyleSheets = await page.evaluate(() => document.adoptedStyleSheets);
        await expect(adoptedStyleSheets).toHaveLength(0);
      });
    });
  });
});
