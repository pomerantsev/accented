import { visit } from 'unist-util-visit';

/**
 * Rehype plugin to wrap h2, h3, and h4 heading contents with anchor tags
 */
export function rehypeWrapHeadings() {
  return (tree) => {
    // console.log('rehypeWrapHeadings plugin is running');
    visit(tree, (node) => {
      // Only process h2, h3, and h4 elements that have an id
      if (['h2', 'h3', 'h4'].includes(node.tagName) && node.properties?.id) {
        const headingId = node.properties.id;

        // Create the span element with the # symbol
        const hashSpan = {
          type: 'element',
          tagName: 'span',
          properties: {
            className: 'hash',
            'aria-hidden': 'true',
          },
          children: [
            {
              type: 'text',
              value: '#',
            },
          ],
        };

        // Create the anchor element with original content plus the hash span
        const anchorNode = {
          type: 'element',
          tagName: 'a',
          properties: {
            href: `#${headingId}`,
          },
          children: [...node.children, hashSpan], // Copy existing children and add hash span
        };

        // Replace the heading's children with just the anchor
        node.children = [anchorNode];
      }
    });
  };
}
