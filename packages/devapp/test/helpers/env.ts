import type { Page } from '@playwright/test';

export async function isDarkMode(page: Page) {
  return await page.evaluate(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return darkModeMediaQuery.matches;
  });
}
