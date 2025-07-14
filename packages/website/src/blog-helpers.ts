import type { CollectionEntry } from 'astro:content';

export function getPostDate(post: CollectionEntry<'blog'>): string {
  const { id } = post;
  const dateMatch = id.match(/^\d{4}-\d{2}-\d{2}/);
  if (!dateMatch) {
    throw new Error(`Invalid post ID format: ${id}`);
  }
  return dateMatch[0];
}

export function formatPostDate(post: CollectionEntry<'blog'>): string {
  const date = new Date(getPostDate(post));
  // We need to adjust for timezone offset since `toLocaleDateString` outputs time in the local timezone.
  const normalizedDate = date.valueOf() + date.getTimezoneOffset() * 60000;
  return new Date(normalizedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getPostUrl(post: CollectionEntry<'blog'>): string {
  const { id } = post;
  return `/blog/${id}`;
}
