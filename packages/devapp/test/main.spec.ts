import { test } from './fixtures/test';
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { expectElementAndTriggerToBeAligned, getTrigger } from './helpers/trigger';
import { openAccentedDialog } from './helpers/dialog';

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
        await expect(adoptedStyleSheets).toHaveLength(1);
      });

      test('adds its attributes to elements, and adds triggers in supporting browsers', async ({ page }) => {
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBeGreaterThan(0);

        const triggerCount = await page.locator(accentedTriggerElementName).count();
        await expect(triggerCount).toBe(count);
      });

      test('triggers have meaningful accessible names', async ({ page }) => {
        const htmlTriggerCount = await page.getByRole('button', { name: 'Accessibility issues in html' }).count();
        await expect(htmlTriggerCount).toBe(1);
        const buttonTriggerCount = await page.getByRole('button', { name: 'Accessibility issues in button' }).count();
        await expect(buttonTriggerCount).toBeGreaterThan(1);
      });
    });

    test.describe('when disabled', () => {
      test.beforeEach(async ({ page }) => {
        await page.getByRole('button', { name: 'Toggle Accented' }).click();
      });

      test('removes the Accented-specific stylesheet from the document', async ({ page }) => {
        const adoptedStyleSheets = await page.evaluate(() => document.adoptedStyleSheets);
        await expect(adoptedStyleSheets).toHaveLength(0);
      });

      test('Accented-specific attributes and triggers are removed', async ({ page }) => {
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBe(0);

        const triggerCount = await page.locator(accentedTriggerElementName).count();
        expect(triggerCount).toBe(0);
      });

      test('can be successfully re-enabled', async ({ page }) => {
        await page.getByRole('button', { name: 'Toggle Accented' }).click();
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBeGreaterThan(0);
      });
    });
  });

  test.describe('quick toggling off and on', () => {
    // I've seen this error in an external app, such quick toggling between on anf off may likely happen with hot reloading
    // in case Accented is toggled on and off on a component's mount and unmount.
    test('doesn’t cause an error', async ({ page }) => {
      await page.goto('?quick-toggle');
      await page.locator(accentedSelector).first().waitFor();
    });
  });

  test.describe('mutations', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('?no-console&callback&throttle-wait=0');
    });

    test('adding an element with an issue results in one more element with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Add one element with an issue' });
      await button.click();
      const newButton1 = await page.getByRole('button', { name: 'Button 1' });
      await expect(newButton1).toHaveAttribute(accentedDataAttr);
      const finalCount = await page.locator(accentedSelector).count();
      const finalTriggerCount = await page.locator(accentedTriggerElementName).count();
      expect(finalCount).toBe(initialCount + 1);
      expect(finalTriggerCount).toBe(finalCount);
    });

    test('removing an element with an issue results in one fewer elements with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Remove button' });
      await button.click();
      const finalCount = await page.locator(accentedSelector).count();
      const finalTriggerCount = await page.locator(accentedTriggerElementName).count();
      expect(finalCount).toBe(initialCount - 1);
      expect(finalTriggerCount).toBe(finalCount);
    });

    test('removing an issue from an element with one issue results in one fewer elements with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Add text to button' });
      await button.click();
      const finalCount = await page.locator(accentedSelector).count();
      const finalTriggerCount = await page.locator(accentedTriggerElementName).count();
      expect(finalCount).toBe(initialCount - 1);
      expect(finalTriggerCount).toBe(finalCount);
    });
  });

  test.describe('rendering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('triggers are rendered in the correct positions', async ({ page }) => {
      const elements = await page.locator(accentedSelector).all();
      for (const element of elements) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        const trigger = await getTrigger(page, element);
        await expectElementAndTriggerToBeAligned(element, trigger);
      }
    });

    test('trigger positions are updated on page resize', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle text direction' }).click();
      const elements = await page.locator(accentedSelector).all();
      for (const element of elements) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        const trigger = await getTrigger(page, element);
        await expectElementAndTriggerToBeAligned(element, trigger);
      }
      await page.setViewportSize({ width: 400, height: 400 });
      for (const element of elements) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        const trigger = await getTrigger(page, element);
        await expectElementAndTriggerToBeAligned(element, trigger);
      }
    });

    test('trigger positions get updated in scrollable regions and are hidden from view when scrolled out', async ({ page }) => {
      const scrollableRegion = await page.locator('#scrollable-region');
      const button1 = await page.locator('#scrollable-test-button-1');
      const button1Trigger = await getTrigger(page, button1);
      const button2 = await page.locator('#scrollable-test-button-2');
      const button2Trigger = await getTrigger(page, button2);

      async function expectToBeHiddenOutsideScrollableRegion(element: Locator) {
        if (await supportsAnchorPositioning(page)) {
          // I'm not sure how to really test the button for visibility here.
          // It's hidden using position-visibility: anchors-visible,
          // but that doesn't seem to affect how Playwright calculates visibility.
          // Hopefully in a future version of Playwright this is addressed.
          await expect(element).toBeVisible();
        } else {
          await expect(element).not.toBeVisible();
        }
      }

      await scrollableRegion.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expect(button1Trigger).toBeVisible();
      await expectElementAndTriggerToBeAligned(button1, button1Trigger);
      await expectToBeHiddenOutsideScrollableRegion(button2Trigger);

      await scrollableRegion.evaluate(element => element.scrollBy(0, 10));
      await page.waitForTimeout(200);
      await expect(button1Trigger).toBeVisible();
      await expectElementAndTriggerToBeAligned(button1, button1Trigger);
      await expectToBeHiddenOutsideScrollableRegion(button2Trigger);

      await button2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expectToBeHiddenOutsideScrollableRegion(button1Trigger);
      await expect(button2Trigger).toBeVisible();
      await expectElementAndTriggerToBeAligned(button2, button2Trigger);
    });

    test('trigger position is correct for a sticky positioned element', async ({ page }) => {
      const button2 = await page.locator('#scrollable-test-button-2');
      const stickyElement = await page.locator('#sticky');
      const stickyElementTrigger = await getTrigger(page, stickyElement);

      await button2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expectElementAndTriggerToBeAligned(stickyElement, stickyElementTrigger);
    });

    test('outlines with certain properties are added to elements', async ({ page }) => {
      const buttonWithIssue = await page.getByRole('button').and(page.locator(accentedSelector)).first();
      const [outlineColor, outlineWidth, outlineOffset] = await buttonWithIssue.evaluate(buttonElement => {
        const computedStyle = window.getComputedStyle(buttonElement)
        return [
          computedStyle.getPropertyValue('outline-color'),
          computedStyle.getPropertyValue('outline-width'),
          computedStyle.getPropertyValue('outline-offset')
        ];
      });
      await expect(outlineColor).toBe('rgb(255, 0, 0)');
      await expect(outlineWidth).toBe('2px');
      await expect(outlineOffset).toBe('-2px');
    });

    test('outlines change color if certain CSS props are set', async ({ page }) => {
      await page.goto('?name=green-accented');
      const buttonWithIssue = await page.getByRole('button').and(page.locator('[data-green-accented]')).first();
      const outlineColor = await buttonWithIssue.evaluate(buttonElement => {
        const computedStyle = window.getComputedStyle(buttonElement)
        return computedStyle.getPropertyValue('outline-color');
      });
      await expect(outlineColor).toBe('rgb(0, 128, 0)');
    });

    test('trigger is interactable if the element with issues has a z-index', async ({ page }) => {
      const buttonWithIssue = await page.locator('#z-index-button');
      const id = await buttonWithIssue.getAttribute(accentedDataAttr);
      const triggerContainer = await page.locator(`accented-trigger[data-id="${id}"]`);
      const trigger = await triggerContainer.locator('#trigger');
      await trigger.click();
    });

    test('a trigger is added for issues in the <html> element', async ({ page }) => {
      const html = await page.locator('html');
      const id = await html.getAttribute(accentedDataAttr);
      const trigger = await page.locator(`accented-trigger[data-id="${id}"]`);
      await expect(trigger).toBeVisible();
    });

    test('a trigger is positioned correctly on a fixed-positioned element', async ({ page }) => {
      const fixedPositionSection = await page.locator('section#fixed-position');
      const id = await fixedPositionSection.getAttribute(accentedDataAttr);
      const triggerContainer = await page.locator(`accented-trigger[data-id="${id}"]`);
      const trigger = await triggerContainer.locator('#trigger');
      await page.mouse.wheel(0, 10);
      const sectionTop = await fixedPositionSection.evaluate(node => {
        return (node as Element).getBoundingClientRect().top;
      });
      const triggerTop = await trigger.evaluate(node => {
        return (node as Element).getBoundingClientRect().top;
      });
      expect(triggerTop).toBe(sectionTop);
    });

    test.describe('anchor positioning', () => {
      test('element with no anchors', async ({ page }) => {
        if (!(await supportsAnchorPositioning(page))) {
          return;
        }
        const element = await page.getByRole('button', { name: 'Button with no anchors' });
        const id = await element.getAttribute(accentedDataAttr);
        const style = await element.getAttribute('style');
        await expect(style).toBe(`anchor-name: --accented-anchor-${id};`);

        await page.getByRole('button', { name: 'Toggle Accented' }).click();

        const styleAfterToggling = await element.getAttribute('style');
        await expect(styleAfterToggling).toBe('');
      });

      test('element with anchors in a stylesheet', async ({ page }) => {
        if (!(await supportsAnchorPositioning(page))) {
          return;
        }
        const element = await page.getByRole('button', { name: 'Button with anchors in a stylesheet' });
        const id = await element.getAttribute(accentedDataAttr);
        const style = await element.getAttribute('style');
        await expect(style).toBe(`anchor-name: --foo, --bar, --accented-anchor-${id};`);

        await page.getByRole('button', { name: 'Toggle Accented' }).click();

        const styleAfterToggling = await element.getAttribute('style');
        await expect(styleAfterToggling).toBe('anchor-name: --foo, --bar;');
      });

      test('element with anchors in a style attribute', async ({ page }) => {
        if (!(await supportsAnchorPositioning(page))) {
          return;
        }
        const element = await page.getByRole('button', { name: 'Button with anchors in a style attribute' });
        const id = await element.getAttribute(accentedDataAttr);
        const style = await element.getAttribute('style');
        await expect(style).toBe(`anchor-name: --foo, --bar, --accented-anchor-${id};`);

        await page.getByRole('button', { name: 'Toggle Accented' }).click();

        const styleAfterToggling = await element.getAttribute('style');
        await expect(styleAfterToggling).toBe('anchor-name: --foo, --bar;');
      });
    });

    test('dialog styles are unaffected by host app styles', async ({ page }) => {
      await page.goto('?small-caps');
      await openAccentedDialog(page, '#over-2-issues');
      const heading = await page.getByRole('heading', { name: 'Accessibility issues' });
      const fontVariant = await heading.evaluate(node => window.getComputedStyle(node).fontVariant);
      await expect(fontVariant).toBe('normal');
    });
  });

  test.describe('console output', () => {
    test('logs elements with issues to the console', async ({ page }) => {
      await page.goto('/');
      const consoleMessage = await page.waitForEvent('console');
      const arg2 = await consoleMessage.args()[1]?.jsonValue();
      await expect(Array.isArray(arg2)).toBeTruthy();
      await expect(arg2.length).toBeGreaterThan(0);
    });

    test('when Accented is toggled off, it doesn’t log an extra message', async ({ page }) => {
      await page.goto('/');
      let messageCount = 0;
      page.on('console', () => {
        messageCount++;
      });
      await page.locator(accentedSelector).first().waitFor();
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      const count = await page.locator(accentedSelector).count();
      await expect(count).toBe(0);
      await expect(messageCount).toBe(1);
    });

    test('console output can be disabled', async ({ page }) => {
      await page.goto('?no-console');
      let messageCount = 0;
      page.on('console', () => {
        messageCount++;
      });
      await page.locator(accentedSelector).first().waitFor();
      await expect(messageCount).toBe(0);
    });
  });

  test.describe('web platform support', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('if the issue is within a link, the link isn’t followed', async ({ page }) => {
      const elementWithIssue = await page.locator('#issue-in-a-link-issue');
      const id = await elementWithIssue.getAttribute(accentedDataAttr);
      const triggerContainer = await page.locator(`accented-trigger[data-id="${id}"]`);
      const trigger = await triggerContainer.locator('#trigger');
      elementWithIssue.scrollIntoViewIfNeeded();
      await trigger.click();
      const closeButton = await page.getByRole('button', { name: 'Close' });
      await closeButton.click();
      const hash = new URL(await page.url()).hash;
      expect(hash).toBe('');
    });

    test('issues in modal dialogs get reported correctly', async ({ page }) => {
      await page.getByRole('button', { name: 'Open modal dialog' }).click();
      const modalDialog = await page.locator('#modal-dialog');
      const triggerContainer = modalDialog.locator('accented-trigger');
      await triggerContainer.click();
      const issueDialog = await page.getByRole('dialog', { name: 'Issues' });
      await expect(issueDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(issueDialog).not.toBeVisible();
      await expect(modalDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modalDialog).not.toBeVisible();
    });

    test('issues in non-modal dialogs get reported correctly', async ({ page }) => {
      await page.getByRole('button', { name: 'Open non-modal dialog' }).click();
      const nonModalDialog = await page.locator('#non-modal-dialog');
      const triggerContainer = nonModalDialog.locator('accented-trigger');
      await triggerContainer.click();
      const issueDialog = await page.getByRole('dialog', { name: 'Issues' });
      await expect(issueDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(issueDialog).not.toBeVisible();
      await expect(nonModalDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(nonModalDialog).toBeVisible();
    });

    test('issues in details elements get reported correctly', async ({ page }) => {
      const details = await page.locator('details');
      const elementsWithIssues = await details.locator(accentedSelector);
      await expect(await elementsWithIssues.count()).toBe(0);
      await details.locator('summary').click();
      await elementsWithIssues.first().waitFor();
      await expect(await elementsWithIssues.count()).toBeGreaterThan(0);
    });

    test('issue triggers are correctly positioned in fullscreen mode', async ({ page }) => {
      const fullscreenContainer = await page.locator('#fullscreen-container');
      const elementWithIssues = await fullscreenContainer.locator(accentedSelector).first();
      await page.getByRole('button', { name: 'Enter fullscreen' }).click();
      await page.waitForTimeout(1000);
      const elementPosition = await elementWithIssues.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, right: rect.right };
      });
      const id = await elementWithIssues.getAttribute(accentedDataAttr);
      const triggerContainer = await page.locator(`accented-trigger[data-id="${id}"]`);
      const trigger = await triggerContainer.locator('#trigger');
      const triggerPosition = await trigger.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, right: rect.right };
      });
      expect(elementPosition.right).toBe(triggerPosition.right);
      expect(elementPosition.top).toBe(triggerPosition.top);
    });
  });

  test.describe('issue dialogs', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('dialog is displayed and contains the element HTML and the expected number of issue descriptions', async ({ page }) => {
      const dialog = await openAccentedDialog(page, '#over-2-issues');
      await expect(dialog).toBeVisible();
      const issueDescriptions = await dialog.locator('#issues > li');
      expect(await issueDescriptions.count()).toBeGreaterThan(2);
      await expect(dialog).toContainText('role="directory"');
    });

    test('issues are sorted by impact', async ({ page }) => {
      const dialog = await openAccentedDialog(page, '#various-impacts');
      const impactElements = await dialog.getByText(/User impact:/);
      const impacts = await impactElements.evaluateAll(elements =>
        elements.map(element => element.textContent?.match(/User impact: (\w+)$/)?.[1]));
      await expect(impacts).toEqual(['critical', 'critical', 'serious', 'moderate', 'minor']);
    });

    test('issue descriptions and element HTML are updated if the element is updated', async ({ page }) => {
      const dialog = await openAccentedDialog(page, '#over-2-issues');
      const initialIssueDescriptionCount = await dialog.locator('#issues > li').count();
      await expect(dialog).toContainText('role="directory"');
      const statusElement = page.locator('#issues-updated-status');
      await statusElement.waitFor();
      // Give the DOM a chance to stabilize
      await page.waitForTimeout(500);
      const updatedIssueDescriptionCount = await dialog.locator('#issues > li').count();
      expect(updatedIssueDescriptionCount).toBeLessThan(initialIssueDescriptionCount);
      await expect(dialog).toContainText('role=""');
    });

    test('the dialog itself doesn’t have accessibility issues identifiable by axe-core', async ({ page }) => {
      const dialog = await openAccentedDialog(page, '#various-impacts');
      const violations = await dialog.evaluate(async (dialogElement) => (await axe.run(dialogElement)).violations);
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('mutation observer', () => {
    test('causes a single scan when the mutation list consists of more than one event', async ({ page }) => {
      await page.goto(`?no-console&callback&throttle-wait=0`);
      // Wait for the first console message
      await page.waitForEvent('console');

      let messageCount = 0;
      page.on('console', () => {
        messageCount++;
      });
      await page.getByRole('button', { name: 'Add two elements with issues' }).click();
      await page.waitForTimeout(200);
      await expect(messageCount).toBe(1);
    });
  });

  test.describe('API', () => {
    test.describe('validations', () => {
      test('throws an error if options is not an object', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto(`?options-invalid=foo`);
      });
      test('throws an error if throttle is not an object', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto(`?throttle-invalid=foo`);
      });
      test('throws an error if throttle.wait is negative', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto(`?throttle-wait=-1`);
      });
      test('throws an error if throttle.wait is not a number', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto(`?throttle-wait-invalid=foo`);
      });
      test('throws an error if output is not an object', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto(`?output-invalid=foo`);
      });
      test('throws an error if callback is not a function', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto(`?callback-invalid=foo`);
      });
      test('throws an error if name is invalid (starts with a number)', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto(`?name=1foo`);
      });
      test('throws an error if name is invalid (contains an uppercase character)', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto(`?name=baR`);
      });
      test('throws an error if name is invalid (contains unicode)', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto(`?name=hello-你好`);
      });
    });

    test('callback', async ({ page }) => {
      await page.goto(`?callback&no-console`);
      const consoleMessage = await page.waitForEvent('console');
      const arg1 = await consoleMessage.args()[0]?.jsonValue();
      await expect(arg1).toEqual('Elements from callback:');
    });

    test('name', async ({ page }) => {
      await page.goto(`?name=my-name`);
      const count = await page.locator('[data-my-name]').count();
      await expect(count).toBeGreaterThan(0);
    });

    test.describe('throttle', () => {
      test('leading: false', async ({ page }) => {
        await page.goto(`?throttle-wait=100&no-leading`);
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBe(0);
        await page.waitForTimeout(1000);
        const countAfter = await page.locator(accentedSelector).count();
        await expect(countAfter).toBeGreaterThan(0);
      });

      test('adding new elements with leading: true', async ({ page }) => {
        await page.goto(`?throttle-wait=300`);
        await page.waitForTimeout(350);
        const button = await page.getByRole('button', { name: 'Add one element with an issue' });
        await button.click();
        await button.click();
        const newButton1 = await page.getByRole('button', { name: 'Button 1' });
        const newButton2 = await page.getByRole('button', { name: 'Button 2' });
        await expect(newButton1).toHaveAttribute(accentedDataAttr);
        await expect(newButton2).not.toHaveAttribute(accentedDataAttr, { timeout: 50 });
        await page.waitForTimeout(350);
        await expect(newButton1).toHaveAttribute(accentedDataAttr);
        await expect(newButton2).toHaveAttribute(accentedDataAttr);
      });

      test('adding new elements with leading: false', async ({ page }) => {
        await page.goto(`?throttle-wait=300&no-leading`);
        await page.waitForTimeout(350);
        const button = await page.getByRole('button', { name: 'Add one element with an issue' });
        await button.click();
        await button.click();
        const newButton1 = await page.getByRole('button', { name: 'Button 1' });
        const newButton2 = await page.getByRole('button', { name: 'Button 2' });
        await expect(newButton1).not.toHaveAttribute(accentedDataAttr, { timeout: 50 });
        await expect(newButton2).not.toHaveAttribute(accentedDataAttr, { timeout: 50 });
        await page.waitForTimeout(350);
        await expect(newButton1).toHaveAttribute(accentedDataAttr);
        await expect(newButton2).toHaveAttribute(accentedDataAttr);
      });
    });
  });

  test.describe('performance', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`?disable&no-console&duration&throttle-wait=100&no-leading`);
    });

    async function expectShortScan(page: Page) {
      const consoleMessage = await page.waitForEvent('console');
      const duration = parseInt(await consoleMessage.args()[1]?.jsonValue(), 10);
      await expect(duration).toBeLessThan(200);
    }

    async function expectLongScan(page: Page) {
      const consoleMessage = await page.waitForEvent('console');
      const duration = parseInt(await consoleMessage.args()[1]?.jsonValue(), 10);
      await expect(duration).toBeGreaterThan(200);
      // It shouldn't be too long though.
      await expect(duration).toBeLessThan(5000);
    }

    test('does not take long to run with few elements', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await expectShortScan(page);
    });

    test('does not take long to run when one element with an issue is added', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      await expectShortScan(page);
    });

    test('takes long to run with many elements with issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with issues' }).click();
      await expectLongScan(page);
    });

    // This behavior should eventually be fixed, but for now, it's a known issue.
    test('causes long tasks when one element is added to many elements with issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with issues' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      await expectLongScan(page);
    });

    test('causes long tasks with many elements with no issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with no issues' }).click();
      await expectLongScan(page);
    });

    // This behavior should eventually be fixed, but for now, it's a known issue.
    test('causes long tasks when one element is added to many elements with no issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with no issues' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      await expectLongScan(page);
    });
  });
});
