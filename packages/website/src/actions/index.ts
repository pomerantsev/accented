import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { UAParser } from 'ua-parser-js';

export const server = {
  collectMetrics: defineAction({
    input: z.object({
      lcp: z.number(),
      commitSha: z.string(),
    }),
    handler: async (input, { request }) => {
      const { browser, os } = UAParser(request.headers.get('user-agent') ?? '');
      const data = {
        ...input,
        browser: {
          name: browser.name,
          major: browser.major,
        },
        os: {
          name: os.name,
          version: os.version,
        },
        createdAt: Date.now(),
        // TODO: strip query string? https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referer
        url: request.headers.get('referer') ?? '',
      };
      console.log(JSON.stringify(data, null, 2));
    },
  }),
};
