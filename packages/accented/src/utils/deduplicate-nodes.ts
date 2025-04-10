export function deduplicateNodes(nodes: Array<Node>): Array<Node> {
  return [...new Set(nodes)];;
}
