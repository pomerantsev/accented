import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { getTrigger, getTriggerContainer } from './trigger';

type Props = {
  primaryColor?: string;
  secondaryColor?: string;
  outlineWidth?: string;
  outlineStyle?: string;
};

export async function expectElementStyles(page: Page, element: Locator, props: Props = {}) {
  const [outlineColor, outlineWidth, outlineStyle] = await element.evaluate((el) => {
    const computedStyle = window.getComputedStyle(el);
    return [
      computedStyle.getPropertyValue('outline-color'),
      computedStyle.getPropertyValue('outline-width'),
      computedStyle.getPropertyValue('outline-style'),
    ];
  });
  await expect(outlineColor).toBe(props.primaryColor || 'oklch(0.5 0.3 0)');
  await expect(outlineWidth).toBe(props.outlineWidth || '2px');
  await expect(outlineStyle).toBe(props.outlineStyle || 'solid');

  const trigger = await getTrigger(await getTriggerContainer(page, element));
  const [triggerColor, triggerBackgroundColor] = await trigger.evaluate((el) => {
    const computedStyle = window.getComputedStyle(el);
    return [
      computedStyle.getPropertyValue('color'),
      computedStyle.getPropertyValue('background-color'),
    ];
  });

  await expect(triggerColor).toBe(props.secondaryColor || 'oklch(0.98 0 0)');
  await expect(triggerBackgroundColor).toBe(props.primaryColor || 'oklch(0.5 0.3 0)');
}
