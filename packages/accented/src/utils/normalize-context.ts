import type { AxeContext, ContextProp, Selector, ScanContext } from '../types';
import { isDocument, isDocumentFragment, isNode, isNodeList } from './dom-helpers.js';
import { deduplicateNodes } from './deduplicate-nodes.js';

function selectorToNodes(selector: Selector): Array<Node> {
  if (typeof selector === 'string') {
    // TODO: how should this work with Shadow DOM?
    return Array.from(document.querySelectorAll(selector));
  } else if (isNode(selector)) {
    return [selector];
  } else {
    // TODO: Verify that this is the actual algorithm for fromShadowDom.
    const node = selector.fromShadowDom.reduce<Node | null>((root, currentSelector, index, array) => {
      if (!root || !(isDocument(root) || isDocumentFragment(root))) {
        return null;
      }
      const nextElement = root.querySelector(currentSelector);
      if (nextElement) {
        if (index === array.length - 1) {
          return nextElement;
        } else {
          return nextElement.shadowRoot;
        }
      } else {
        return null;
      }
    }, document);
    return node ? [node] : [];
  }
}

function contextPropToNodes(contextProp: ContextProp): Array<Node> {
  let nodes: Array<Node> = [];
  if (typeof contextProp === 'object' && (Array.isArray(contextProp) || isNodeList(contextProp))) {
    nodes = Array.from(contextProp).map(item => selectorToNodes(item)).flat();
  } else {
    nodes = selectorToNodes(contextProp);
  }
  return deduplicateNodes(nodes, 'equality');
}

export default function normalizeContext(axeContext: AxeContext): ScanContext {
  let axeContextInclude: Array<Node> = [];
  let axeContextExclude: Array<Node> = [];
  const include: Array<Node> = [];
  const exclude: Array<Node> = [];
  if (typeof axeContext === 'object' && ('include' in axeContext || 'exclude' in axeContext)) {
    if (axeContext.include !== undefined) {
      axeContextInclude = contextPropToNodes(axeContext.include);
    }
    if (axeContext.exclude !== undefined) {
      axeContextExclude = contextPropToNodes(axeContext.exclude);
    }
  } else {
    axeContextInclude = contextPropToNodes(axeContext);
  }
  if (axeContextInclude.length === 0) {
    axeContextInclude.push(document);
  }

  return {
    include: axeContextInclude,
    exclude: axeContextExclude
  };
}
