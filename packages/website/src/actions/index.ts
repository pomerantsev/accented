import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { UAParser } from 'ua-parser-js';
import { isAIAssistant, isAICrawler, isBot } from 'ua-parser-js/bot-detection';
import { db } from '../../db';
import { metrics } from '../../db/schema';

export const server = {
  collectMetrics: defineAction({
    input: z.object({
      lcp: z.number(),
      commitSha: z.string(),
    }),
    handler: async (input, { request }) => {
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
            majorVersion: browser.major,
            fullVersion: browser.version,
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

      // TODO: remove the logging once we've verified that things are properly stored in the DB.
      console.log(JSON.stringify(data, null, 2));

      await db.insert(metrics).values({
        lcp: input.lcp,
        commitSha: input.commitSha,
        pathname,
        browserName: browser.name,
        browserVersion: browser.version,
        browserMajor: browser.major,
        osName: os.name,
        osVersion: os.version,
        isBot: isBot(userAgent),
        isAIAssistant: isAIAssistant(userAgent),
        isAICrawler: isAICrawler(userAgent),
      });
    },
  }),
};
