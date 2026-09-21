import type { Page } from '@playwright/test';

/** What the page has sent through navigator.sendBeacon, which the tests replace. */
export function getSentBeacons(page: Page) {
  return page.evaluate(() => window.__accentedSentBeacons);
}
