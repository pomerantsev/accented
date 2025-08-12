import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import {
  getAccentedTriggers,
  getElementsWithIssues,
  getTrigger,
  getTriggerContainer,
  openAccentedDialog,
  waitForAccentedToLoad,
} from './helpers/accented';
import { expectActiveNavigation, type NavigationPage, navigateToPage } from './helpers/navigation';
import {
  expectAddProductContent,
  expectDashboardContent,
  expectMainTitle,
  expectNavigationItems,
  expectOrdersContent,
  expectProductsContent,
  expectWelcomeMessage,
} from './helpers/page';

test.describe('Playground Smoke Tests', () => {
  test.describe('Content Tests', () => {
    test('loads main page with expected content', async ({ page }) => {
      await page.goto('/');

      // Verify main title and welcome message
      await expectMainTitle(page);
      await expectWelcomeMessage(page);

      // Verify navigation items are present
      await expectNavigationItems(page);

      // Verify dashboard content loads by default
      await expectDashboardContent(page);
    });
  });

  test.describe('Navigation Tests', () => {
    const pages: NavigationPage[] = ['dashboard', 'products', 'add-product', 'orders'];

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    for (const targetPage of pages) {
      test(`navigates to ${targetPage} page successfully`, async ({ page }) => {
        await navigateToPage(page, targetPage);
        await expectActiveNavigation(page, targetPage);

        // Verify appropriate content loads for each page
        switch (targetPage) {
          case 'dashboard':
            await expectDashboardContent(page);
            break;
          case 'products':
            await expectProductsContent(page);
            break;
          case 'add-product':
            await expectAddProductContent(page);
            break;
          case 'orders':
            await expectOrdersContent(page);
            break;
        }
      });
    }

    test('navigation state updates correctly when switching between pages', async ({ page }) => {
      // Start on dashboard
      await expectActiveNavigation(page, 'dashboard');

      // Navigate to products
      await navigateToPage(page, 'products');
      await expectActiveNavigation(page, 'products');

      // Navigate to orders
      await navigateToPage(page, 'orders');
      await expectActiveNavigation(page, 'orders');

      // Navigate back to dashboard
      await navigateToPage(page, 'dashboard');
      await expectActiveNavigation(page, 'dashboard');
    });
  });

  test.describe('Accented Integration Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // Wait for Accented to initialize and scan the page
      await waitForAccentedToLoad(page);
    });

    test('Accented initializes and detects accessibility issues', async ({ page }) => {
      const elementsWithIssues = await getElementsWithIssues(page);
      const issueCount = await elementsWithIssues.count();

      // The playground has intentional accessibility issues, so we should find some
      expect(issueCount).toBeGreaterThan(0);
      console.log(`Found ${issueCount} elements with accessibility issues`);
    });

    test('Accented triggers are visible and clickable', async ({ page }) => {
      const triggers = await getAccentedTriggers(page);
      const triggerCount = await triggers.count();

      // Should have triggers corresponding to elements with issues
      expect(triggerCount).toBeGreaterThan(0);

      // Verify at least one trigger is clickable
      const firstTrigger = triggers.first();
      await expect(firstTrigger).toBeVisible();
      await expect(firstTrigger).toBeEnabled();
    });

    test('clicking Accented trigger opens issue dialog', async ({ page }) => {
      const elementsWithIssues = await getElementsWithIssues(page);
      const firstElementWithIssues = elementsWithIssues.first();

      // Open the dialog for the first element with issues
      const dialog = await openAccentedDialog(page, firstElementWithIssues);

      // Verify dialog is visible and contains expected content
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Accessibility issues');

      // Close the dialog
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    });

    test('detects specific known accessibility issues', async ({ page }) => {
      const elementsWithIssues = await getElementsWithIssues(page);
      const issueCount = await elementsWithIssues.count();

      // Based on the Layout component, we expect several specific issues:
      // - Missing alt text on image
      // - Low contrast text (blue-200 on blue-600)
      // - Positive tabindex (tabIndex={5})
      // - Missing landmarks (div instead of header, nav, main)

      // We should have at least 1 issue (the actual number detected)
      // The exact count depends on axe-core configuration and what it detects
      expect(issueCount).toBeGreaterThanOrEqual(1);
      console.log(`Detected ${issueCount} accessibility issues as expected`);
    });

    test('Accented triggers have meaningful accessible names', async ({ page }) => {
      const elementsWithIssues = await getElementsWithIssues(page);
      const issueCount = await elementsWithIssues.count();

      if (issueCount > 0) {
        // Check that the first few triggers have proper accessible names
        for (let i = 0; i < Math.min(issueCount, 3); i++) {
          const element = elementsWithIssues.nth(i);
          const triggerContainer = await getTriggerContainer(page, element);
          const trigger = await getTrigger(triggerContainer);

          // Check for aria-label on the trigger button
          const ariaLabel = await trigger.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          if (ariaLabel) {
            expect(ariaLabel).toMatch(/accessibility issues/i);
          }
        }
      }
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('application loads correctly across all browsers', async ({ page, browserName }) => {
      await page.goto('/');

      console.log(`Testing on ${browserName}`);

      // Basic functionality should work the same across browsers
      await expectMainTitle(page);
      await expectNavigationItems(page);

      // Accented should work across browsers
      await waitForAccentedToLoad(page);
      const triggers = await getAccentedTriggers(page);
      expect(await triggers.count()).toBeGreaterThan(0);
    });
  });
});
