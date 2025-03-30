import axe from 'axe-core';
import { test } from './fixtures/test';
import { expect } from '@playwright/test';
import { openAccentedDialog } from './helpers/dialog';
import { isDarkMode } from './helpers/env';
import { expectElementToHaveOutline } from './helpers/element';
import { expectElementAndTriggerToBeAligned, getTriggerContainer } from './helpers/trigger';

const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;

test.describe('Accented', () => {
  test.describe('rendering', () => {
    test('outlines with certain properties are added to elements', async ({ page }) => {
      await page.goto('/');
      const buttonWithIssue = await page.getByRole('button').and(page.locator(accentedSelector)).first();
      await expectElementToHaveOutline(buttonWithIssue);
    });
  });

  test.describe('issue dialogs', () => {
    test('issues are sorted by impact and have specific background colors', async ({ page }) => {
      await page.goto('/');
      const dialog = await openAccentedDialog(page, '#various-impacts');
      const impactElements = await dialog.getByText(/User impact:/);
      const impacts = await impactElements.evaluateAll(elements =>
        elements.map(element => element.textContent?.match(/User impact: (\w+)$/)?.[1]));
      await expect(impacts).toEqual(['critical', 'critical', 'serious', 'moderate', 'minor']);

      const colorMap = (await isDarkMode(page)) ? {
        critical: 'oklch(0.45 0.16 0)',
        serious: 'oklch(0.45 0.16 90)',
        moderate: 'oklch(0.45 0.16 230)',
        minor: 'oklch(0.45 0 0)'
      } : {
        critical: 'oklch(0.8 0.16 0)',
        serious: 'oklch(0.8 0.16 90)',
        moderate: 'oklch(0.8 0.16 230)',
        minor: 'oklch(0.8 0 0)'
      }

      const backgroundColors = await impactElements.evaluateAll(elements =>
        elements.map(element => window.getComputedStyle(element).backgroundColor));
      await expect(backgroundColors).toEqual([
        colorMap.critical, colorMap.critical, colorMap.serious, colorMap.moderate, colorMap.minor
      ]);
    });

    test('the dialog itself doesn’t have accessibility issues identifiable by axe-core', async ({ page }) => {
      await page.goto('/');
      const dialog = await openAccentedDialog(page, '#various-impacts');
      const violations = await dialog.evaluate(async (dialogElement) => (await axe.run(dialogElement)).violations);
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('web platform support', () => {
    test.describe('shadow DOM', () => {
      test('an element in shadow DOM has a trigger that is aligned with the element, and an outline', async ({ page }) => {
        await page.goto('/');
        const elementWithIssue = await page.locator(`#button-in-shadow-dom${accentedSelector}`);
        await elementWithIssue.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        const triggerContainer = await getTriggerContainer(page, elementWithIssue);
        await expectElementAndTriggerToBeAligned(elementWithIssue, triggerContainer);
        await expectElementToHaveOutline(elementWithIssue);
      });

      test('when an element is moved to a different shadow root, it gets a trigger that is aligned with the element', async ({ page }) => {
        await page.goto('/');
        (await page.getByRole('button', { name: 'Move button between shadow roots' })).click();
        await page.waitForTimeout(1200);
        const elementWithIssue = await page.locator(`#button-in-shadow-dom${accentedSelector}`);
        await elementWithIssue.scrollIntoViewIfNeeded();
        const triggerContainer = await getTriggerContainer(page, elementWithIssue);
        await expectElementAndTriggerToBeAligned(elementWithIssue, triggerContainer);
        await expectElementToHaveOutline(elementWithIssue);
      });
    });
  });
});
