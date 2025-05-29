import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

export async function expectElementToHaveOutline(element: Locator) {
  const [outlineColor, outlineWidth, outlineOffset] = await element.evaluate((el) => {
    const computedStyle = window.getComputedStyle(el);
    return [
      computedStyle.getPropertyValue('outline-color'),
      computedStyle.getPropertyValue('outline-width'),
      computedStyle.getPropertyValue('outline-offset'),
    ];
  });
  await expect(outlineColor).toBe('oklch(0.5 0.3 0)');
  await expect(outlineWidth).toBe('2px');
  await expect(outlineOffset).toBe('-2px');
}
