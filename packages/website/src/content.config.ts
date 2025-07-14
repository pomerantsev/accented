import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '????-??-??-*.mdx', base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
  }),
});

export const collections = { blog };
