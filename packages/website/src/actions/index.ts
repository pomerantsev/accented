import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  collectMetrics: defineAction({
    input: z.object({
      name: z.string(),
    }),
    handler: async (input, { request }) => {
      console.log('Action input:', input);
      console.log('Action request headers:', request.headers);
      return `Hello, ${input.name}`;
    },
  }),
};
