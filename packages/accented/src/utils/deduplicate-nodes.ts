import contains from './contains.js';

export function deduplicateNodes(nodes: Array<Node>, type: 'equality' | 'containment'): Array<Node> {
  return nodes.filter((node, index) => {
    return !nodes.some((otherNode, otherIndex) => {
      return index !== otherIndex && (
        type === 'containment' && contains(otherNode, node)
          || type === 'equality' && otherNode === node
      );
    });
  });
}
