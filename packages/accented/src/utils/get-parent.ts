import { isDocumentFragment, isShadowRoot } from './dom-helpers.js';

export function getParent(element: Element): Element | null {
  if (element.parentElement) {
    return element.parentElement;
  }

  const rootNode = element.getRootNode();
  if (isDocumentFragment(rootNode) && isShadowRoot(rootNode)) {
    return rootNode.host;
  }

  return null;
}
