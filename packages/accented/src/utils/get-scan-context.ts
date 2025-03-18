import type { AxeContext, ContextProp, Selector } from '../types';
import { isDocument, isDocumentFragment, isNode, isNodeList } from './dom-helpers.js';

type ScanContext = {
  include: Array<Node>;
  exclude: Array<Node>;
}

function selectorToNodes(selector: Selector): Array<Node> {
  if (typeof selector === 'string') {
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
  if (typeof axeContext === 'object' && ('include' in axeContext || 'exclude' in axeContext)) {
    let include: Array<Node> = [];
    let exclude: Array<Node> = [];
    if (axeContext.include !== undefined) {
      include = contextPropToNodes(axeContext.include);
    }
    if (axeContext.exclude !== undefined) {
      exclude = contextPropToNodes(axeContext.exclude);
    }
    return { include, exclude };
  } else {
    return {
      include: contextPropToNodes(axeContext),
      exclude: []
    };
  }
}
