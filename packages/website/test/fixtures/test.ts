import { test as base } from '@playwright/test';

type SentBeacon = { url: string; body: unknown };

declare global {
  interface Window {
    /** Set by the stub below, so it's only present on pages opened by the tests. */
    __accentedSentBeacons?: Array<SentBeacon>;
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    // The analytics beacon reaches an action that writes to a database the tests don't have.
    // The server then renders an error overlay into the page, which adds a second <h1>
    // and makes the page unclickable.
    //
    // Intercepting the request with page.route doesn't help: Firefox sends the beacon
    // regardless, so navigator.sendBeacon itself is replaced. What the page tried to send
    // is recorded on the window, for the tests that assert on it.
    await page.addInitScript(() => {
      const beacons: Array<SentBeacon> = [];
      window.__accentedSentBeacons = beacons;

      navigator.sendBeacon = (url, data) => {
        const beacon: SentBeacon = { url: String(url), body: null };
        beacons.push(beacon);

        if (data instanceof Blob) {
          data.text().then((text) => {
            beacon.body = JSON.parse(text);
          });
        }

        return true;
      };
    });

    await use(page);
  },
});
