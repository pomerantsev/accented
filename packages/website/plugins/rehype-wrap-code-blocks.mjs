import { visit } from 'unist-util-visit';

/**
 * Rehype plugin to wrap <pre> elements in a custom <copy-code> element
 */
export function rehypeWrapCodeBlocks() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      // Only process <pre> elements
      if (node.tagName === 'pre') {
        // Create the copy-code wrapper element
        const wrapperNode = {
          type: 'element',
          tagName: 'copy-code',
          properties: {},
          children: [node], // Wrap the entire <pre> element
        };

        // Replace the <pre> element with the wrapper in the parent's children
        if (parent && typeof index === 'number') {
          parent.children[index] = wrapperNode;
        }
      }
    });
  };
}
