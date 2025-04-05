export function deduplicateNodes(nodes: Array<Node>): Array<Node> {
  return nodes.filter((node, index) => {
    return !nodes.some((otherNode, otherIndex) => {
      return index !== otherIndex && otherNode === node;
    });
  });
}
