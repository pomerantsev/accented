import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '????-??-??-*.mdx', base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
  }),
});

export const collections = { blog };
