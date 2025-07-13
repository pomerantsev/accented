import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/data/blog' }),
});

export const collections = { blog };
