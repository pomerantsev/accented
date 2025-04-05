import type { AxeContext, ContextProp, Selector, ScanContext } from '../types';
import { isNode, isNodeList } from './dom-helpers.js';
import { deduplicateNodes } from './deduplicate-nodes.js';

function recursiveSelectAll(selectors: Array<string>, root: Document | ShadowRoot): Array<Node> {
  const nodesOnCurrentLevel = root.querySelectorAll(selectors[0]!);
  if (selectors.length === 1) {
    return Array.from(nodesOnCurrentLevel);
  }
  const restSelectors: Array<string> = selectors.slice(1);
  const selected = [];
  for (const node of nodesOnCurrentLevel) {
    if (node.shadowRoot) {
      selected.push(...recursiveSelectAll(restSelectors, node.shadowRoot));
    }
  }
  return selected;
}

function selectorToNodes(selector: Selector): Array<Node> {
  if (typeof selector === 'string') {
    return recursiveSelectAll([selector], document);
  } else if (isNode(selector)) {
    return [selector];
  } else {
    return recursiveSelectAll(selector.fromShadowDom, document);
  }
}

function contextPropToNodes(contextProp: ContextProp): Array<Node> {
  let nodes: Array<Node> = [];
  if (typeof contextProp === 'object' && (Array.isArray(contextProp) || isNodeList(contextProp))) {
    nodes = Array.from(contextProp).map(item => selectorToNodes(item)).flat();
  } else {
    nodes = selectorToNodes(contextProp);
  }
  return deduplicateNodes(nodes);
}

export default function normalizeContext(axeContext: AxeContext): ScanContext {
  let axeContextInclude: Array<Node> = [];
  let axeContextExclude: Array<Node> = [];
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

  return {
    include: axeContextInclude,
    exclude: axeContextExclude
  };
}
