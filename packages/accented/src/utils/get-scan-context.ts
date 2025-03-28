import type { AxeContext, ContextProp, Selector, ScanContext } from '../types';
import { isDocument, isDocumentFragment, isNode, isNodeList } from './dom-helpers.js';
import contains from './contains.js';

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
  if (typeof contextProp === 'object' && (Array.isArray(contextProp) || isNodeList(contextProp))) {
    return Array.from(contextProp).map(item => selectorToNodes(item)).flat()
  } else {
    return selectorToNodes(contextProp);
  }
}

// TODO: actually take nodes into account
export default function getScanContext(nodes: Array<Node>, axeContext: AxeContext): ScanContext {
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

  // TODO: this is way oversimplified, needs to be significantly expanded
  // exclude not taken care of
  // de-duplication not taken care of
  // The isElementInScanContext (or maybe isNodeInScanContext) and this function should reuse the `contains` logic
  // that takes shadow DOM into account.
  for (const node of nodes) {
    const descendants = axeContextInclude.filter(item => contains(node, item));
    include.push(...descendants);
  }
  for (const item of axeContextInclude) {
    const descendants = nodes.filter(node => contains(item, node));
    include.push(...descendants);
  }
  return {
    include,
    exclude
  };
}
