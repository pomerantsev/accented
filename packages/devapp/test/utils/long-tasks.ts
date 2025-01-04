import type { Page } from '@playwright/test';

declare global {
  interface Window {
    longTaskCount: number;
  }
}

export async function countLongTasks(page: Page) {
  const supported = await page.evaluate(() => PerformanceObserver.supportedEntryTypes.includes('longtask'));
  if (!supported) {
    return false;
  }
  return {
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
