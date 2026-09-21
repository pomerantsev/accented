import type { Page } from '@playwright/test';

const textareaId = 'clipboard-readback';

/**
 * Reads the clipboard by pasting into a temporary textarea.
 *
 * `navigator.clipboard.readText()` would be more direct, but WebKit rejects it,
 * whereas pasting works in every browser we test.
 */
export async function readClipboard(page: Page): Promise<string> {
  await page.evaluate((id) => {
    const textarea = document.createElement('textarea');
    textarea.id = id;
    document.body.prepend(textarea);
  }, textareaId);

  const textarea = page.locator(`#${textareaId}`);
  await textarea.focus();
  await page.keyboard.press('ControlOrMeta+V');
  const contents = await textarea.inputValue();

  await page.evaluate((id) => document.getElementById(id)?.remove(), textareaId);

  return contents;
}
