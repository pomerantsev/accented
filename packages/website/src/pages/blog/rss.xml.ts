import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { getPostDate, getPostUrl } from '~/blog-helpers';

export async function GET({ site }: { site: URL }) {
  const posts = await getCollection('blog');
  const items = posts.map((post) => {
    const { title, description } = post.data;
    return {
      title,
      description,
      link: getPostUrl(post),
      pubDate: new Date(getPostDate(post)),
    };
  });

  return rss({
    title: 'Accented blog',
    description:
      'What’s going on with Accented, the frontend library for continuous accessibility testing and issue highlighting.',
    site,
    trailingSlash: false,
    items,
    customData: '<language>en-US</language>',
  });
}
