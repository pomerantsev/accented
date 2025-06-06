import { isDocumentFragment, isShadowRoot } from './dom-helpers.js';

export function contains(ancestor: Node, descendant: Node): boolean {
  if (ancestor.contains(descendant)) {
    return true;
  }
  let rootNode = descendant.getRootNode();
  while (rootNode) {
    if (!(isDocumentFragment(rootNode) && isShadowRoot(rootNode))) {
      return false;
    }
    const host = rootNode.host;
    if (ancestor.contains(host)) {
      return true;
    }
    rootNode = host.getRootNode();
  }
  return false;
}
