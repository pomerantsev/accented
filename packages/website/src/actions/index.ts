import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { UAParser } from 'ua-parser-js';
import { isAIAssistant, isAICrawler, isBot } from 'ua-parser-js/bot-detection';

export const server = {
  collectMetrics: defineAction({
    input: z.object({
      lcp: z.number(),
      commitSha: z.string(),
    }),
    handler: async (input, { request }) => {
      console.log('Entering the handler');
      let pathname: string | null;
      try {
        const url = new URL(request.headers.get('referer') ?? '');
        pathname = url.pathname;
      } catch {
        pathname = null;
      }
      const userAgent = request.headers.get('user-agent') ?? '';
      const { browser, os } = UAParser(userAgent);
      const data = {
        ...input,
        userAgent: {
          browser: {
            name: browser.name,
            major: browser.major,
          },
          os: {
            name: os.name,
            version: os.version,
          },
          isBot: isBot(userAgent),
          isAIAssistant: isAIAssistant(userAgent),
          isAICrawler: isAICrawler(userAgent),
        },
        pathname,
      };

      // TODO: instead of just logging, we'll soon start saving this data to a DB.
      console.log(JSON.stringify(data, null, 2));
    },
  }),
};
