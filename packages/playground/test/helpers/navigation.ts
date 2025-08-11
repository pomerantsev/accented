import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Navigation helper functions for the playground app.
 */

export type NavigationPage = 'dashboard' | 'products' | 'add-product' | 'orders';

/**
 * Navigate to a specific page using the sidebar navigation.
 */
export async function navigateToPage(page: Page, targetPage: NavigationPage): Promise<void> {
  const pageNames = {
    dashboard: 'Dashboard',
    products: 'Products',
    'add-product': 'Add Product',
    orders: 'Orders',
  };

  const buttonName = pageNames[targetPage];
  // Use sidebar-specific locator to avoid ambiguity
  const sidebarButton = page.locator('.w-64.bg-white').getByRole('button', { name: buttonName });
  await sidebarButton.click();
}

/**
 * Verify that the correct navigation button is active.
 */
export async function expectActiveNavigation(
  page: Page,
  activePage: NavigationPage,
): Promise<void> {
  const pageNames = {
    dashboard: 'Dashboard',
    products: 'Products',
    'add-product': 'Add Product',
    orders: 'Orders',
  };

  const activeButtonName = pageNames[activePage];

  // Use a more specific locator to find the navigation button in the sidebar
  const sidebarButton = page
    .locator('.w-64.bg-white')
    .getByRole('button', { name: activeButtonName });

  // Check that the active button has the correct styling (blue background)
  await expect(sidebarButton).toHaveClass(/bg-blue-100/);
}
