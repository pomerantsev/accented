export function isNode(obj: object): obj is Node {
  return (
    'nodeType' in obj &&
    typeof obj.nodeType === 'number' &&
    'nodeName' in obj &&
    typeof obj.nodeName === 'string'
  );
}

export function isNodeList(obj: object): obj is NodeList {
  return Object.prototype.toString.call(obj) === '[object NodeList]';
}

export function isElement(node: Node): node is Element {
  return typeof Node !== 'undefined' && node.nodeType === Node.ELEMENT_NODE;
}

export function isDocument(node: Node): node is Document {
  return typeof Node !== 'undefined' && node.nodeType === Node.DOCUMENT_NODE;
}

export function isDocumentFragment(node: Node): node is DocumentFragment {
  return typeof Node !== 'undefined' && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
}

export function isShadowRoot(documentFragment: DocumentFragment): documentFragment is ShadowRoot {
  return 'host' in documentFragment;
}

export function isHtmlElement(element: Element): element is HTMLElement {
  // We can't use instanceof because it may not work across contexts
  // (such as when an element is moved from an iframe).
  // This heuristic seems to be the most robust and fastest that I could think of.
  return element.constructor.name.startsWith('HTML');
}

export function isSvgElement(element: Element): element is SVGElement {
  // We can't use instanceof because it may not work across contexts
  // (such as when an element is moved from an iframe).
  // This heuristic seems to be the most robust and fastest that I could think of.
  return element.constructor.name.startsWith('SVG');
}
