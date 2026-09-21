import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pagesDirectory = fileURLToPath(new URL('../../src/pages', import.meta.url));
const blogDirectory = fileURLToPath(new URL('../../src/blog', import.meta.url));

const pageExtensions = /\.(astro|mdx)$/;

/** Page files under src/pages, paired with the URL each one is served at. */
function getPages(): Array<{ url: string; filePath: string }> {
  return (
    readdirSync(pagesDirectory, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && pageExtensions.test(entry.name))
      .map((entry) => ({
        filePath: path.join(entry.parentPath, entry.name),
        route: path.join(path.relative(pagesDirectory, entry.parentPath), entry.name),
      }))
      // Dynamic routes ([post].astro) are covered by the blog posts below,
      // and the 404 page isn't reachable by its own URL.
      .filter(({ route }) => !route.includes('[') && path.basename(route) !== '404.astro')
      .map(({ filePath, route }) => ({
        filePath,
        url: `/${route.replace(pageExtensions, '').replace(/(^|\/)index$/, '')}`,
      }))
  );
}

/**
 * URLs of the pages the site serves, derived from the file system
 * so that pages and blog posts added later are covered without updating the tests.
 */
export function getPageUrls(): Array<string> {
  // Blog post URLs are built the same way as in blog-helpers: /blog/<file name>.
  const blogPosts = readdirSync(blogDirectory)
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => `/blog/${fileName.replace(/\.mdx$/, '')}`);

  return [...getPages().map(({ url }) => url), ...blogPosts].sort();
}

/** URLs of the pages that render a table of contents — most pages don't. */
export function getPageUrlsWithTableOfContents(): Array<string> {
  return getPages()
    .filter(({ filePath }) => readFileSync(filePath, 'utf8').includes('<TableOfContents'))
    .map(({ url }) => url)
    .sort();
}
