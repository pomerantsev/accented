import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { test } from './fixtures/test';

import { openAccentedDialog } from './helpers/dialog';
import {
  expectElementAndTriggerToBeAligned,
  getTrigger,
  getTriggerContainer,
} from './helpers/trigger';

const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;
const accentedTriggerElementName = 'accented-trigger';

const supportsAnchorPositioning = async (page: Page) =>
  await page.evaluate(() => {
    function isWebKit() {
      const ua = navigator.userAgent;
      return (/AppleWebKit/.test(ua) && !/Chrome/.test(ua)) || /\b(iPad|iPhone|iPod)\b/.test(ua);
    }
    // ATTENTION: sync with the implementation in the library.
    // I didn't find a way to sync this with automatically with the implementation of supportsAnchorPositioning
    // in the library, so it has to be synced manually.
    return (
      CSS.supports('anchor-name: --foo') && CSS.supports('position-anchor: --foo') && !isWebKit()
    );
  });

test.describe('Accented', () => {
  test.describe('basic functionality', () => {
    test.describe('when enabled', () => {
      test('adds an Accented-specific stylesheet to the document', async ({ page }) => {
        await page.goto('/');
        const adoptedStyleSheets = await page.evaluate(() => document.adoptedStyleSheets);
        await expect(adoptedStyleSheets).toHaveLength(1);
      });

      test('adds its attributes to elements, and adds triggers in supporting browsers', async ({
        page,
      }) => {
        await page.goto('/');
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBeGreaterThan(0);

        const triggerCount = await page.locator(accentedTriggerElementName).count();
        await expect(triggerCount).toBe(count);
      });

      test('triggers have meaningful accessible names', async ({ page }) => {
        await page.goto('/');
        const htmlTriggerCount = await page
          .getByRole('button', { name: 'Accessibility issues in html' })
          .count();
        await expect(htmlTriggerCount).toBe(1);
        const buttonTriggerCount = await page
          .getByRole('button', { name: 'Accessibility issues in button' })
          .count();
        await expect(buttonTriggerCount).toBeGreaterThan(1);
      });

      test('an element with issues can still be interacted with', async ({ page }) => {
        await page.goto('?no-console');
        const buttonWithIssue = await page.locator(`#button-with-single-issue${accentedSelector}`);
        let messageText: string | undefined;
        page.on('console', (message) => {
          messageText = message.text();
        });
        await buttonWithIssue.click();
        expect(messageText).toBe('Button clicked');
      });

      test('doesn’t report issues that may be caused by another Accented trigger', async ({
        page,
      }) => {
        await page.goto('?throttle-wait=100');
        await page.locator(`#low-contrast-list-item${accentedSelector}`);
        const addDivToListButton = await page.getByRole('button', { name: 'Add div to list' });
        await addDivToListButton.click();
        await page.waitForTimeout(500);

        // We know that the list contains a div, but the structural issue on the list may also be caused
        // by the trigger that's set on the low-contrast element,
        // so we decided not to report such cases.
        expect(
          await page.locator(`#correctly-structured-list${accentedSelector}`),
        ).not.toBeVisible();
        const increaseListItemContrastButton = await page.getByRole('button', {
          name: 'Increase list item contrast',
        });
        await increaseListItemContrastButton.click();
        await page.waitForTimeout(500);

        // Now the only issue in the list is the structural one (a div as a child of a ul),
        // however on the last scan the issue trigger on the low-contrast item was still present,
        // so this time the issue on the parent will not be reported.
        expect(
          await page.locator(`#correctly-structured-list${accentedSelector}`),
        ).not.toBeVisible();

        await addDivToListButton.click();
        await page.waitForTimeout(500);

        // Now finally we ran the scan without any triggers present,
        // so the issue will be reported.
        expect(await page.locator(`#correctly-structured-list${accentedSelector}`)).toBeVisible();
      });
    });

    test.describe('when disabled', () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/');
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

    test('adding an element with an issue results in one more element with issues displayed', async ({
      page,
    }) => {
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

    test('removing an element with an issue results in one fewer elements with issues displayed', async ({
      page,
    }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Remove button' });
      await button.click();
      const finalCount = await page.locator(accentedSelector).count();
      const finalTriggerCount = await page.locator(accentedTriggerElementName).count();
      expect(finalCount).toBe(initialCount - 1);
      expect(finalTriggerCount).toBe(finalCount);
    });

    test('removing an issue from an element with one issue results in one fewer elements with issues displayed', async ({
      page,
    }) => {
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

    test('sizes of Accented elements don’t fall below a certain threshold', async ({ page }) => {
      const round = (value: string) => Math.round(Number.parseFloat(value) * 10) / 10;

      const sizes = [
        // Default base font size, which in most browsers is 16px
        { baseFontSize: '', expectedTriggerSize: 32, expectedIssueLinkFontSize: 19.2 },
        // When base font size grows, Accented elements also grow
        { baseFontSize: '24px', expectedTriggerSize: 48, expectedIssueLinkFontSize: 28.8 },
        // When base font size shrinks, Accented elements stay at the base size
        // (so they don't become unreadable)
        { baseFontSize: '8px', expectedTriggerSize: 32, expectedIssueLinkFontSize: 19.2 },
      ];

      for (const { baseFontSize, expectedTriggerSize, expectedIssueLinkFontSize } of sizes) {
        await page.goto(`?base-font-size=${baseFontSize}`);
        const buttonWithIssue = await page.locator('#button-with-single-issue');
        const triggerContainer = await getTriggerContainer(page, buttonWithIssue);
        const trigger = await getTrigger(triggerContainer);
        const triggerInlineSize = await trigger.evaluate(
          (node) => window.getComputedStyle(node).inlineSize,
        );
        await expect(round(triggerInlineSize)).toBe(expectedTriggerSize);

        await trigger.click();
        const issueLink = await page.getByRole('link', {
          name: 'Buttons must have discernible text',
        });
        const issueLinkFontSize = await issueLink.evaluate(
          (node) => window.getComputedStyle(node).fontSize,
        );
        await expect(round(issueLinkFontSize)).toBe(expectedIssueLinkFontSize);
      }
    });

    test('triggers are rendered in the correct positions, and are all interactable', async ({
      page,
    }) => {
      const elements = await page.locator(accentedSelector).all();
      for (const element of elements) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        const triggerContainer = await getTriggerContainer(page, element);
        await expectElementAndTriggerToBeAligned(element, triggerContainer);

        const issueDialog = await openAccentedDialog(page, element);
        await expect(issueDialog).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(issueDialog).not.toBeVisible();
      }
    });

    test('trigger positions are updated on page resize', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle text direction' }).click();
      const elements = await page.locator(accentedSelector).all();
      for (const element of elements) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        const triggerContainer = await getTriggerContainer(page, element);
        await expectElementAndTriggerToBeAligned(element, triggerContainer);
      }
      await page.setViewportSize({ width: 400, height: 400 });
      for (const element of elements) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        const triggerContainer = await getTriggerContainer(page, element);
        await expectElementAndTriggerToBeAligned(element, triggerContainer);
      }
    });

    test('trigger positions get updated in scrollable regions and are hidden from view when scrolled out', async ({
      page,
    }) => {
      const scrollableRegion = await page.locator('#scrollable-region');
      const button1 = await page.locator('#scrollable-test-button-1');
      const button1TriggerContainer = await getTriggerContainer(page, button1);
      const button1Trigger = await getTrigger(button1TriggerContainer);
      const button2 = await page.locator('#scrollable-test-button-2');
      const button2TriggerContainer = await getTriggerContainer(page, button2);
      const button2Trigger = await getTrigger(button2TriggerContainer);

      async function expectToBeHiddenOutsideScrollableRegion(element: Locator) {
        await expect(element).not.toBeVisible();
      }

      await scrollableRegion.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expect(button1Trigger).toBeVisible();
      await expectElementAndTriggerToBeAligned(button1, button1TriggerContainer);
      await expectToBeHiddenOutsideScrollableRegion(button2Trigger);

      await scrollableRegion.evaluate((element) => element.scrollBy(0, 10));
      await page.waitForTimeout(200);
      await expect(button1Trigger).toBeVisible();
      await expectElementAndTriggerToBeAligned(button1, button1TriggerContainer);
      await expectToBeHiddenOutsideScrollableRegion(button2Trigger);

      await button2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expectToBeHiddenOutsideScrollableRegion(button1TriggerContainer);
      await expect(button2Trigger).toBeVisible();
      await expectElementAndTriggerToBeAligned(button2, button2TriggerContainer);
    });

    test('trigger position is correct for a sticky positioned element', async ({ page }) => {
      const button2 = await page.locator('#scrollable-test-button-2');
      const stickyElement = await page.locator('#sticky');
      const stickyElementTriggerContainer = await getTriggerContainer(page, stickyElement);

      await button2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expectElementAndTriggerToBeAligned(stickyElement, stickyElementTriggerContainer);
    });

    test('outlines change color if certain CSS props are set', async ({ page }) => {
      await page.goto('?name=green-accented');
      const buttonWithIssue = await page
        .getByRole('button')
        .and(page.locator('[data-green-accented]'))
        .first();
      const outlineColor = await buttonWithIssue.evaluate((buttonElement) => {
        const computedStyle = window.getComputedStyle(buttonElement);
        return computedStyle.getPropertyValue('outline-color');
      });
      await expect(outlineColor).toBe('rgb(0, 128, 0)');
    });

    test('trigger is interactable if the element with issues has a z-index', async ({ page }) => {
      const buttonWithIssue = await page.locator('#z-index-button');
      const triggerContainer = await getTriggerContainer(page, buttonWithIssue);
      const trigger = await getTrigger(triggerContainer);
      await trigger.click();
    });

    test('a trigger is added for issues in the <html> element', async ({ page }) => {
      const html = await page.locator('html');
      const triggerContainer = await getTriggerContainer(page, html);
      await expect(triggerContainer).toBeVisible();
    });

    test('a trigger is positioned correctly on a fixed-positioned element', async ({ page }) => {
      const fixedPositionSection = await page.locator('section#fixed-position');
      const triggerContainer = await getTriggerContainer(page, fixedPositionSection);
      await page.mouse.wheel(0, 10);
      await expectElementAndTriggerToBeAligned(fixedPositionSection, triggerContainer);
    });

    test('a trigger’s position remains correct on transforms', async ({ page }) => {
      const elementWithTransforms = await page.locator('#transformed-button');
      const triggerContainer = await getTriggerContainer(page, elementWithTransforms);
      await page.waitForTimeout(200);
      await expectElementAndTriggerToBeAligned(elementWithTransforms, triggerContainer);
      (await page.getByRole('button', { name: 'Change button transform' })).click();
      await page.waitForTimeout(200);
      await expectElementAndTriggerToBeAligned(elementWithTransforms, triggerContainer);
      (await page.getByRole('button', { name: 'Change section transform' })).click();
      await page.waitForTimeout(200);
      await expectElementAndTriggerToBeAligned(elementWithTransforms, triggerContainer);
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
        const element = await page.getByRole('button', {
          name: 'Button with anchors in a stylesheet',
        });
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
        const element = await page.getByRole('button', {
          name: 'Button with anchors in a style attribute',
        });
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
      const fontVariant = await heading.evaluate(
        (node) => window.getComputedStyle(node).fontVariant,
      );
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

      // Expect that only certain keys are present on each element
      const expectedKeys = ['element', 'issues'];
      await expect(Object.keys(arg2[0]).length).toBe(expectedKeys.length);
      for (const key of expectedKeys) {
        await expect(arg2[0]).toHaveProperty(key);
      }
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
    test('if the issue is within a link, the link isn’t followed', async ({ page }) => {
      await page.goto('/');
      const elementWithIssue = await page.locator('#issue-in-a-link-issue');
      const triggerContainer = await getTriggerContainer(page, elementWithIssue);
      const trigger = await getTrigger(triggerContainer);
      await elementWithIssue.scrollIntoViewIfNeeded();
      await trigger.click();
      const closeButton = await page.getByRole('button', { name: 'Close' });
      await closeButton.click();
      const hash = new URL(await page.url()).hash;
      expect(hash).toBe('');
    });

    test('when trigger is clicked, a click handler on an ancestor isn’t invoked', async ({
      page,
    }) => {
      await page.goto('?throttle-wait=500&no-leading&no-console');

      let messageCount = 0;
      page.on('console', () => {
        messageCount++;
      });

      const link = await page.locator('#issue-in-a-link-link');
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(messageCount).toBe(1);

      const elementWithIssue = await page.locator(`#issue-in-a-link-issue${accentedSelector}`);
      const triggerContainer = await getTriggerContainer(page, elementWithIssue);
      const trigger = await getTrigger(triggerContainer);
      await elementWithIssue.scrollIntoViewIfNeeded();
      await trigger.click();
      const closeButton = await page.getByRole('button', { name: 'Close' });
      await closeButton.click();

      await expect(messageCount).toBe(1);
    });

    test('issues in modal dialogs get reported correctly', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Open modal dialog' }).click();
      const modalDialog = await page.locator('#modal-dialog');
      await modalDialog.locator(accentedSelector).first().waitFor();
      const issueDialog = await openAccentedDialog(page, '#modal-dialog-button');
      await expect(issueDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(issueDialog).not.toBeVisible();
      await expect(modalDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modalDialog).not.toBeVisible();
    });

    test('issues in non-modal dialogs get reported correctly', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Open non-modal dialog' }).click();
      const nonModalDialog = await page.locator('#non-modal-dialog');
      await nonModalDialog.locator(accentedSelector).first().waitFor();
      const issueDialog = await openAccentedDialog(page, '#non-modal-dialog-button');
      await expect(issueDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(issueDialog).not.toBeVisible();
      await expect(nonModalDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(nonModalDialog).toBeVisible();
    });

    test('issues in details elements get reported correctly', async ({ page }) => {
      await page.goto('/');
      const details = await page.locator('#details');
      const elementsWithIssues = await details.locator(accentedSelector);
      await expect(await elementsWithIssues.count()).toBe(0);
      await details.locator('summary').click();
      await elementsWithIssues.first().waitFor();
      await expect(await elementsWithIssues.count()).toBeGreaterThan(0);
    });

    test('the Accented trigger on a <summary> is visible when collapsed', async ({ page }) => {
      await page.goto('/');

      const summaryContainer = await page.locator('#summary');
      await summaryContainer.scrollIntoViewIfNeeded();

      const summary = await summaryContainer.locator('summary');

      const triggerContainer = await getTriggerContainer(page, summary);

      await expect(triggerContainer).toBeVisible();
    });

    test('issue triggers are correctly positioned in fullscreen mode', async ({ page }) => {
      await page.goto('/');
      const fullscreenContainer = await page.locator('#fullscreen-container');
      const elementWithIssues = await fullscreenContainer.locator(accentedSelector).first();
      await page.getByRole('button', { name: 'Enter fullscreen' }).click();
      await page.waitForTimeout(1000);
      const triggerContainer = await getTriggerContainer(page, elementWithIssues);
      await expectElementAndTriggerToBeAligned(elementWithIssues, triggerContainer);
    });

    // This ensures that we don't use instanceof
    test('element with an issue moved from an iframe behaves as expected', async ({ page }) => {
      await page.goto('/');
      (await page.getByRole('button', { name: 'Move element from iframe' })).click();
      const elementWithIssue = await page.locator(`#button-from-iframe${accentedSelector}`);
      await elementWithIssue.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const triggerContainer = await getTriggerContainer(page, elementWithIssue);
      await expectElementAndTriggerToBeAligned(elementWithIssue, triggerContainer);
    });

    test.describe('shadow DOM', () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/');
      });

      test('the shadow root that contains elements with issues get the Accented styleshet', async ({
        page,
      }) => {
        const shadowDOMContainer1 = await page.locator('#shadow-dom-container-1');
        const adoptedStyleSheets = await shadowDOMContainer1.evaluate(
          (element) => element.shadowRoot?.adoptedStyleSheets,
        );
        await expect(adoptedStyleSheets).toHaveLength(1);
      });

      test('the shadow root that doesn’t contain elements with issues doesn’t get the Accented stylesheet', async ({
        page,
      }) => {
        const shadowDOMContainer2 = await page.locator('#shadow-dom-container-2');
        const adoptedStyleSheets = await shadowDOMContainer2.evaluate(
          (element) => element.shadowRoot?.adoptedStyleSheets,
        );
        await expect(adoptedStyleSheets).toHaveLength(0);
      });
    });

    test('an issue in a nested SVG is reported in the console, but an outline and trigger are not rendered for it', async ({
      page,
    }) => {
      await page.goto('?axe-context-selector=%23nested-svg');

      const consoleMessage = await page.waitForEvent('console');
      const arg2 = await consoleMessage.args()[1]?.jsonValue();
      await expect(Array.isArray(arg2)).toBeTruthy();
      await expect(arg2.length).toBe(1);

      const count = await page.locator(accentedSelector).count();
      await expect(count).toBe(0);

      const triggerCount = await page.locator(accentedTriggerElementName).count();
      await expect(triggerCount).toBe(0);
    });

    test('an issue inside <head> is reported in the console, but a trigger is not rendered for it', async ({
      page,
    }) => {
      await page.goto('?axe-context-selector=head');

      const consoleMessage = await page.waitForEvent('console');
      const arg2 = await consoleMessage.args()[1]?.jsonValue();
      await expect(Array.isArray(arg2)).toBeTruthy();
      await expect(arg2.length).toBe(1);

      const count = await page.locator(accentedSelector).count();
      await expect(count).toBe(0);

      const triggerCount = await page.locator(accentedTriggerElementName).count();
      await expect(triggerCount).toBe(0);
    });

    test('issues in table cells don’t break the table layout', async ({ page }) => {
      await page.goto('?axe-context-selector=%23table');

      const tableSection = await page.locator('#table');
      await tableSection.scrollIntoViewIfNeeded();

      const count = await page.locator(`${accentedSelector}:is(th, td)`).count();
      await expect(count).toBe(2);

      const rows = await tableSection.locator('tr').all();
      for (const row of rows) {
        expect(await row.evaluate((node) => node.children.length)).toBe(3);
      }
    });
  });

  test.describe('issue dialogs', () => {
    test('dialog is displayed and contains the element HTML and the expected number of issue descriptions', async ({
      page,
    }) => {
      await page.goto('/');
      const dialog = await openAccentedDialog(page, '#over-2-issues');
      await expect(dialog).toBeVisible();
      const issueDescriptions = await dialog.locator('#issues > li');
      expect(await issueDescriptions.count()).toBeGreaterThan(2);
      await expect(dialog).toContainText('role="directory"');
    });

    for (const url of [
      '?remove-some-issues-on-timeout',
      '?remove-all-issues-on-timeout',
      '?remove-element-on-timeout',
    ]) {
      test(`issue descriptions and element HTML are not updated when on ${url}`, async ({
        page,
      }) => {
        await page.goto(url);
        const dialog = await openAccentedDialog(page, '#over-2-issues');
        const initialIssueDescriptionCount = await dialog.locator('#issues > li').count();
        await expect(dialog).toContainText('role="directory"');
        const statusElement = page.locator('#issues-updated-status');
        await statusElement.waitFor();
        // Give the DOM a chance to stabilize
        await page.waitForTimeout(500);
        const updatedIssueDescriptionCount = await dialog.locator('#issues > li').count();
        expect(updatedIssueDescriptionCount).toBe(initialIssueDescriptionCount);
        await expect(dialog).not.toContainText('role=""');
      });
    }

    test('dialog can be dismissed by clicking the mouse outside the dialog', async ({ page }) => {
      await page.goto('/');
      const dialog = await openAccentedDialog(page, '#various-impacts');
      await expect(dialog).toBeVisible();
      await page.mouse.click(10, 10);
      await expect(dialog).not.toBeVisible();
    });

    test('dialog can be dismissed by pressing Escape, and the keydown event doesn’t propagate', async ({
      page,
    }) => {
      await page.goto('?no-console');
      let messageCount = 0;
      page.on('console', (event) => {
        messageCount++;
        console.log(event);
      });
      const dialog = await openAccentedDialog(page, '#various-impacts');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      expect(messageCount).toBe(0);
    });
  });

  test.describe('mutation observer', () => {
    test('causes a single scan when the mutation list consists of more than one event', async ({
      page,
    }) => {
      await page.goto('?no-console&callback&throttle-wait=0');
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
        await page.goto('?options-invalid=foo');
      });
      test('throws an error if throttle is not an object', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto('?throttle-invalid=foo');
      });
      test('throws an error if throttle.wait is negative', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto('?throttle-wait=-1');
      });
      test('throws an error if throttle.wait is not a number', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto('?throttle-wait-invalid=foo');
      });
      test('throws an error if output is not an object', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto('?output-invalid=foo');
      });
      test('throws an error if callback is not a function', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto('?callback-invalid=foo');
      });
      test('throws an error if name is invalid (starts with a number)', async ({
        page,
        expectErrors,
      }) => {
        expectErrors(1);
        await page.goto('?name=1foo');
      });
      test('throws an error if name is invalid (contains an uppercase character)', async ({
        page,
        expectErrors,
      }) => {
        expectErrors(1);
        await page.goto('?name=baR');
      });
      test('throws an error if name is invalid (contains unicode)', async ({
        page,
        expectErrors,
      }) => {
        expectErrors(1);
        await page.goto('?name=hello-你好');
      });
      test('throws an error if axeOptions is not an object', async ({ page, expectErrors }) => {
        expectErrors(1);
        await page.goto('?axe-options-invalid=foo');
      });
      test('throws an error if axeOptions contains unsupported keys', async ({
        page,
        expectErrors,
      }) => {
        expectErrors(1);
        await page.goto('?axe-options-reporter=v1');
      });
    });

    test.describe('callback', () => {
      test('elements with issues', async ({ page }) => {
        await page.goto('?callback&no-console');
        const consoleMessage = await page.waitForEvent('console');
        const arg1 = await consoleMessage.args()[0]?.jsonValue();
        await expect(arg1).toEqual('Elements from callback:');
      });

      test('uses expected scan context', async ({ page }) => {
        await page.goto('?disable&no-console&scan-context&throttle-wait=100&no-leading');
        await page.getByRole('button', { name: 'Toggle Accented' }).click();
        await page.waitForEvent('console');

        let contextLength: number | undefined;
        let contextElementId: string | undefined;

        page.on('console', async (message) => {
          const args = message.args();
          const { length, id } = await args[1]?.evaluate((scanContext) => {
            return {
              length: scanContext.length,
              id: scanContext[0].id,
            };
          })!;
          contextLength = length;
          contextElementId = id;
        });

        await page.getByRole('button', { name: 'Add one element with an issue' }).click();

        await page.waitForTimeout(500);

        expect(contextLength).toBe(1);
        expect(contextElementId).toBe('few-elements');
      });
    });

    test('name', async ({ page }) => {
      await page.goto('?name=my-name');
      const count = await page.locator('[data-my-name]').count();
      await expect(count).toBeGreaterThan(0);
    });

    test.describe('throttle', () => {
      test('leading: false', async ({ page }) => {
        await page.goto('?throttle-wait=100&no-leading');
        const count = await page.locator(accentedSelector).count();
        await expect(count).toBe(0);
        await page.waitForTimeout(1000);
        const countAfter = await page.locator(accentedSelector).count();
        await expect(countAfter).toBeGreaterThan(0);
      });

      test('adding new elements with leading: true', async ({ page }) => {
        await page.goto('?throttle-wait=300');
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
        await page.goto('?throttle-wait=1000&no-leading');
        await page.waitForTimeout(1100);
        const button = await page.getByRole('button', { name: 'Add one element with an issue' });
        await button.click();
        await button.click();
        const newButton1 = await page.getByRole('button', { name: 'Button 1' });
        const newButton2 = await page.getByRole('button', { name: 'Button 2' });
        await expect(newButton1).not.toHaveAttribute(accentedDataAttr, { timeout: 50 });
        await expect(newButton2).not.toHaveAttribute(accentedDataAttr, { timeout: 50 });
        await page.waitForTimeout(1100);
        await expect(newButton1).toHaveAttribute(accentedDataAttr);
        await expect(newButton2).toHaveAttribute(accentedDataAttr);
      });
    });

    test('runOnly', async ({ page }) => {
      await page.goto('?run-only=wcag21aa');
      const count = await page.locator(accentedSelector).count();
      // We only added one element with a WCAG 2.1 AA issue.
      await expect(count).toBe(1);
    });

    test('rules', async ({ page }) => {
      await page.goto('/');
      const totalCount = await page.locator(accentedSelector).count();
      await expect(totalCount).toBeGreaterThan(0);
      await page.goto('?disable-rules=button-name');
      const countWithoutButtonName = await page.locator(accentedSelector).count();
      await expect(countWithoutButtonName).toBeGreaterThan(1);
      await expect(countWithoutButtonName).toBeLessThan(totalCount);
    });

    test.describe('context', () => {
      test('selector', async ({ page }) => {
        await page.goto('/');
        const totalCount = await page.locator(accentedSelector).count();
        await expect(totalCount).toBeGreaterThan(0);
        await page.goto('?axe-context-selector=button');
        const countOnlyButtons = await page.locator(accentedSelector).count();
        await expect(countOnlyButtons).toBeGreaterThan(1);
        await expect(countOnlyButtons).toBeLessThan(totalCount);
      });

      test('element', async ({ page }) => {
        await page.goto('/');
        const totalCount = await page.locator(accentedSelector).count();
        await expect(totalCount).toBeGreaterThan(0);
        await page.goto('?axe-context-body');
        const countOnlyButtons = await page.locator(accentedSelector).count();
        await expect(countOnlyButtons).toBeGreaterThan(1);
        await expect(countOnlyButtons).toBeLessThan(totalCount);

        // Also implicitly testing that passing an element as context
        // doesn't throw an error.
        // This was happening when deepMerge was trying to merge two Node instances.
      });

      // TODO: test other context types (https://github.com/pomerantsev/accented/issues/179).
      // deepMerge may now be working correctly,
      // but if `document` is no longer the default,
      // things may break without us knowing.
    });
  });

  test.describe('performance', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('?disable&no-console&performance&throttle-wait=100&no-leading');
    });

    type Duration = 'short' | 'long';

    async function expectPerformance(
      page: Page,
      { scan, domUpdate }: { scan: Duration; domUpdate: Duration },
    ) {
      const consoleMessage = await page.waitForEvent('console');
      const perfObject = await consoleMessage.args()[1]?.jsonValue();
      const scanDuration = perfObject.scan;
      const domUpdateDuration = perfObject.domUpdate;
      if (scan === 'short') {
        await expect(scanDuration).toBeLessThan(500);
      } else {
        await expect(scanDuration).toBeGreaterThan(200);
      }
      if (domUpdate === 'short') {
        await expect(domUpdateDuration).toBeLessThan(250);
      } else {
        await expect(domUpdateDuration).toBeGreaterThan(250);
      }
    }

    test('does not take long to run with few elements', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await expectPerformance(page, { scan: 'short', domUpdate: 'short' });
    });

    test('does not take long to run when one element with an issue is added', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      await expectPerformance(page, { scan: 'short', domUpdate: 'short' });
    });

    test('takes long to run with many elements with issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with issues' }).click();
      await expectPerformance(page, { scan: 'long', domUpdate: 'short' });
    });

    test('does not take long to run when one element is added to many elements with issues', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with issues' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      await expectPerformance(page, { scan: 'short', domUpdate: 'short' });
    });

    test('takes long to run with many elements with no issues', async ({ page }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with no issues' }).click();
      await expectPerformance(page, { scan: 'long', domUpdate: 'short' });
    });

    test('does not take long to run when one element is added to many elements with no issues', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Toggle Accented' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add many elements with no issues' }).click();
      await page.waitForEvent('console');
      await page.getByRole('button', { name: 'Add one element with an issue' }).click();
      await expectPerformance(page, { scan: 'short', domUpdate: 'short' });
    });
  });
});
