import type { Page } from '@playwright/test';

declare global {
  interface Window {
    longTaskCount: number;
  }
}

export function countLongTasks(page: Page) {
  return {
    async supported() {
      return await page.evaluate(() => PerformanceObserver.supportedEntryTypes.includes('longtask'));
    },
    async start() {
      return await page.evaluate(async () => {
        window.longTaskCount = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            window.longTaskCount++;
          }
        }).observe({ type: 'longtask' });
        await new Promise(resolve => setTimeout(resolve, 100));
      });
    },
    async getCount() {
      return await page.evaluate(() => window.longTaskCount);
    }
  };
}
