import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import axe from 'axe-core';

const accentedDataAttr = 'data-accented';
const accentedSelector = `[${accentedDataAttr}]`;
const accentedTriggerElementName = 'accented-trigger';

const supportsAnchorPositioning = async (page: Page) =>
  await page.evaluate(() => CSS.supports('anchor-name: --foo') && CSS.supports('position-anchor: --foo'));

test.describe('Accented', () => {
  let errorCount = 0;
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', error => {
      console.log(error.message);
      errorCount++;
    });
  });
  test.afterEach(async () => {
    await expect(errorCount).toBe(0);
  });

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
        if (await supportsAnchorPositioning(page)) {
          await expect(triggerCount).toBe(count);
        } else {
          await expect(triggerCount).toBe(0);
        }
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
      if (await supportsAnchorPositioning(page)) {
        expect(finalTriggerCount).toBe(finalCount);
      } else {
        expect(finalTriggerCount).toBe(0);
      }
    });

    test('removing an element with an issue results in one fewer elements with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Remove button' });
      await button.click();
      const finalCount = await page.locator(accentedSelector).count();
      const finalTriggerCount = await page.locator(accentedTriggerElementName).count();
      expect(finalCount).toBe(initialCount - 1);
      if (await supportsAnchorPositioning(page)) {
        expect(finalTriggerCount).toBe(finalCount);
      } else {
        expect(finalTriggerCount).toBe(0);
      }
    });

    test('removing an issue from an element with one issue results in one fewer elements with issues displayed', async ({ page }) => {
      const initialCount = await page.locator(accentedSelector).count();
      const button = await page.getByRole('button', { name: 'Add text to button' });
      await button.click();
      const finalCount = await page.locator(accentedSelector).count();
      const finalTriggerCount = await page.locator(accentedTriggerElementName).count();
      expect(finalCount).toBe(initialCount - 1);
      if (await supportsAnchorPositioning(page)) {
        expect(finalTriggerCount).toBe(finalCount);
      } else {
        expect(finalTriggerCount).toBe(0);
      }
    });
  });

  test.describe('rendering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('triggers are rendered in the correct positions', async ({ page }) => {
      if (!(await supportsAnchorPositioning(page))) {
        return;
      }
      const nodes = await page.locator(accentedSelector).elementHandles();
      for (const node of nodes) {
        const elementPosition = await node.evaluate(n => {
          const rect = (n as Element).getBoundingClientRect();
          return { top: rect.top, right: rect.right };
        });
        const id = await node.getAttribute(accentedDataAttr);
        const triggerContainer = await page.locator(`accented-trigger[data-id="${id}"]`);
        const trigger = await triggerContainer.locator('#trigger');
        const triggerPosition = await trigger.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return { top: rect.top, right: rect.right };
        });
        expect(elementPosition.right).toBe(triggerPosition.right);
        expect(elementPosition.top).toBe(triggerPosition.top);
      }
    });

    test('triggers are rendered in the correct positions for right-to-left writing mode', async ({ page }) => {
      if (!(await supportsAnchorPositioning(page))) {
        return;
      }
      await page.getByRole('button', { name: 'Toggle text direction' }).click();
      const nodes = await page.locator(accentedSelector).elementHandles();
      for (const node of nodes) {
        const elementPosition = await node.evaluate(n => {
          const rect = (n as Element).getBoundingClientRect();
          return { top: rect.top, left: rect.left };
        });
        const id = await node.getAttribute(accentedDataAttr);
        const triggerContainer = await page.locator(`accented-trigger[data-id="${id}"]`);
        const trigger = await triggerContainer.locator('#trigger');
        const triggerPosition = await trigger.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return { top: rect.top, left: rect.left };
        });
        expect(elementPosition.left).toBe(triggerPosition.left);
        expect(elementPosition.top).toBe(triggerPosition.top);
      }
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
      if ((await supportsAnchorPositioning(page))) {
        await trigger.click();
      } else {
        await expect(trigger).not.toBeAttached();
      }
    });

    test('a trigger is added for issues in the <html> element', async ({ page }) => {
      const html = await page.locator('html');
      const id = await html.getAttribute(accentedDataAttr);
      const trigger = await page.locator(`accented-trigger[data-id="${id}"]`);
      if ((await supportsAnchorPositioning(page))) {
        await expect(trigger).toBeVisible();
      } else {
        await expect(trigger).not.toBeAttached();
      }
    });

    test('a trigger is positioned correctly on a fixed-positioned element', async ({ page }) => {
      const fixedPositionSection = await page.locator('section#fixed-position');
      const id = await fixedPositionSection.getAttribute(accentedDataAttr);
      const triggerContainer = await page.locator(`accented-trigger[data-id="${id}"]`);
      const trigger = await triggerContainer.locator('#trigger');
      if ((await supportsAnchorPositioning(page))) {
        await page.mouse.wheel(0, 10);
        const sectionTop = await fixedPositionSection.evaluate(node => {
          return (node as Element).getBoundingClientRect().top;
        });
        const triggerTop = await trigger.evaluate(node => {
          return (node as Element).getBoundingClientRect().top;
        });
        expect(triggerTop).toBe(sectionTop);
      } else {
        await expect(trigger).not.toBeAttached();
      }
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
      if ((await supportsAnchorPositioning(page))) {
        elementWithIssue.scrollIntoViewIfNeeded();
        await trigger.click();
        const closeButton = await page.getByRole('button', { name: 'Close' });
        await closeButton.click();
        const hash = new URL(await page.url()).hash;
        expect(hash).toBe('');
      } else {
        await expect(trigger).not.toBeAttached();
      }
    });

    test('issues in modal dialogs get reported correctly', async ({ page }) => {
      await page.getByRole('button', { name: 'Open modal dialog' }).click();
      const modalDialog = await page.locator('#modal-dialog');
      const triggerContainer = modalDialog.locator('accented-trigger');
      if (await supportsAnchorPositioning(page)) {
        await triggerContainer.click();
        const issueDialog = await page.getByRole('dialog', { name: 'Issues' });
        await expect(issueDialog).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(issueDialog).not.toBeVisible();
        await expect(modalDialog).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(modalDialog).not.toBeVisible();
      } else {
        await expect(triggerContainer).not.toBeAttached();
      }
    });

    test('issues in non-modal dialogs get reported correctly', async ({ page }) => {
      await page.getByRole('button', { name: 'Open non-modal dialog' }).click();
      const nonModalDialog = await page.locator('#non-modal-dialog');
      const triggerContainer = nonModalDialog.locator('accented-trigger');
      if (await supportsAnchorPositioning(page)) {
        await triggerContainer.click();
        const issueDialog = await page.getByRole('dialog', { name: 'Issues' });
        await expect(issueDialog).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(issueDialog).not.toBeVisible();
        await expect(nonModalDialog).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(nonModalDialog).toBeVisible();
      } else {
        await expect(triggerContainer).not.toBeAttached();
      }
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
      if (!(await supportsAnchorPositioning(page))) {
        return;
      }
      const fullscreenContainer = await page.locator('#fullscreen-container');
      const elementWithIssues = await fullscreenContainer.locator(accentedSelector).first();
      await page.getByRole('button', { name: 'Enter fullscreen' }).click();
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

    test('dialog is displayed and contains the expected number of issue descriptions', async ({ page }) => {
      const buttonWithIssues = await page.locator('#over-2-issues');
      const id = await buttonWithIssues.getAttribute(accentedDataAttr);
      const trigger = await page.locator(`accented-trigger[data-id="${id}"]`);
      if ((await supportsAnchorPositioning(page))) {
        await trigger.click();
        const dialog = await page.getByRole('dialog', { name: 'Issues' });
        await expect(dialog).toBeVisible();
        const issueDescriptions = await dialog.locator('#issues > li');
        expect(await issueDescriptions.count()).toBeGreaterThan(2);
      } else {
        await expect(trigger).not.toBeAttached();
      }
    });

    test('issue descriptions are updated if the element is updated', async ({ page }) => {
      const buttonWithIssues = await page.locator('#over-2-issues');
      const id = await buttonWithIssues.getAttribute(accentedDataAttr);
      const trigger = await page.locator(`accented-trigger[data-id="${id}"]`);
      if ((await supportsAnchorPositioning(page))) {
        await trigger.click();
        const dialog = await page.getByRole('dialog', { name: 'Issues' });
        const initialIssueDescriptionCount = await dialog.locator('#issues > li').count();
        const statusElement = page.locator('#issues-updated-status');
        await statusElement.waitFor();
        const updatedIssueDescriptionCount = await dialog.locator('#issues > li').count();
        expect(updatedIssueDescriptionCount).toBeLessThan(initialIssueDescriptionCount);
      } else {
        await expect(trigger).not.toBeAttached();
      }
    });

    test('the dialog itself doesn’t have accessibility issues identifiable by axe-core', async ({ page }) => {
      const buttonWithIssues = await page.locator('#over-2-issues');
      const id = await buttonWithIssues.getAttribute(accentedDataAttr);
      const trigger = await page.locator(`accented-trigger[data-id="${id}"]`);
      if ((await supportsAnchorPositioning(page))) {
        await trigger.click();
        const dialog = await page.getByRole('dialog', { name: 'Issues' });
        const violations = await dialog.evaluate(async (dialogElement) => (await axe.run(dialogElement)).violations);
        expect(violations).toHaveLength(0);
      } else {
        await expect(trigger).not.toBeAttached();
      }
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
        await page.waitForTimeout(250);
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

  // 2025.01.04: these tests will currently not do anything in Safari and Firefox
  // because they don't support the longtask PerformanceObserver entry type.
  // We could potentially use mark and measure that work in all browsers,
  // but testing this only in Chromium is probably good enough for now.
  test.describe('performance', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`?disable&no-console&duration&throttle-wait=100&no-leading`);
    });

    async function expectShortScan(page: Page) {
      const consoleMessage = await page.waitForEvent('console');
      const duration = parseInt(await consoleMessage.args()[1]?.jsonValue(), 10);
      await expect(duration).toBeLessThan(150);
    }

    async function expectLongScan(page: Page) {
      const consoleMessage = await page.waitForEvent('console');
      const duration = parseInt(await consoleMessage.args()[1]?.jsonValue(), 10);
      await expect(duration).toBeGreaterThan(150);
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
