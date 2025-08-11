import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page content helper functions for the playground app.
 */

/**
 * Verify that the main header contains the expected application title.
 */
export async function expectMainTitle(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'MerchantHub Admin' })).toBeVisible();
}

/**
 * Verify that the welcome message is visible.
 */
export async function expectWelcomeMessage(page: Page): Promise<void> {
  await expect(page.getByText('Welcome back, Admin')).toBeVisible();
}

/**
 * Verify that all main navigation items are present.
 */
export async function expectNavigationItems(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Products' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Product' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Orders' })).toBeVisible();
}

/**
 * Verify that the dashboard page content is loaded.
 */
export async function expectDashboardContent(page: Page): Promise<void> {
  // Verify the main heading
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();

  // Verify key dashboard metrics are present
  await expect(page.getByText('Total Products')).toBeVisible();
  await expect(page.getByText('Orders Today')).toBeVisible();
  await expect(page.getByText('Revenue')).toBeVisible();
  await expect(page.getByText('Customers')).toBeVisible();

  // Verify dashboard sections
  await expect(page.getByRole('heading', { name: 'Recent Orders', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Low Stock Alert', level: 2 })).toBeVisible();
}

/**
 * Verify that the products page content is loaded.
 */
export async function expectProductsContent(page: Page): Promise<void> {
  // Verify the main heading
  await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();

  // Verify table headers are present (for desktop view) using table-specific locators
  // Use table th elements since the columnheader role might not be properly set
  await expect(page.locator('table th:has-text("Product")')).toBeVisible();
  await expect(page.locator('table th:has-text("Category")')).toBeVisible();
  await expect(page.locator('table th:has-text("Price")')).toBeVisible();
  await expect(page.locator('table th:has-text("Stock")')).toBeVisible();
  await expect(page.locator('table th:has-text("Status")')).toBeVisible();
  await expect(page.locator('table th:has-text("Actions")')).toBeVisible();
}

/**
 * Verify that the add product page content is loaded.
 */
export async function expectAddProductContent(page: Page): Promise<void> {
  // Verify the main heading
  await expect(page.getByRole('heading', { name: 'Add New Product', level: 1 })).toBeVisible();

  // Verify key form elements are present
  await expect(page.getByText('Product Name *')).toBeVisible();
  await expect(page.getByText('Price *')).toBeVisible();
  await expect(page.getByText('Category *')).toBeVisible();
  await expect(page.getByText('Stock Quantity')).toBeVisible();
  await expect(page.getByText('Description')).toBeVisible();
  await expect(page.getByText('Product Image URL')).toBeVisible();

  // Verify form buttons (use form locator to be more specific)
  await expect(page.locator('form').getByRole('button', { name: 'Clear Form' })).toBeVisible();
  await expect(page.locator('form').getByRole('button', { name: 'Add Product' })).toBeVisible();
}

/**
 * Verify that the orders page content is loaded.
 */
export async function expectOrdersContent(page: Page): Promise<void> {
  // Verify the main heading
  await expect(page.getByRole('heading', { name: 'Orders', level: 1 })).toBeVisible();

  // Verify table headers are present (for desktop view) using table-specific locators
  await expect(page.locator('table th:has-text("Order ID")')).toBeVisible();
  await expect(page.locator('table th:has-text("Customer")')).toBeVisible();
  await expect(page.locator('table th:has-text("Total")')).toBeVisible();
  await expect(page.locator('table th:has-text("Status")')).toBeVisible();
  await expect(page.locator('table th:has-text("Date")')).toBeVisible();
  await expect(page.locator('table th:has-text("Actions")')).toBeVisible();
}
