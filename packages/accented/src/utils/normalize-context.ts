import type { Context, ContextProp, ScanContext, Selector } from '../types.ts';
import { deduplicateNodes } from './deduplicate-nodes.js';
import { isNode, isNodeList } from './dom-helpers.js';

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

export default function normalizeContext(context: Context): ScanContext {
  let contextInclude: Array<Node> = [];
  let contextExclude: Array<Node> = [];
  if (typeof context === 'object' && ('include' in context || 'exclude' in context)) {
    if (context.include !== undefined) {
      contextInclude = contextPropToNodes(context.include);
    }
    if (context.exclude !== undefined) {
      contextExclude = contextPropToNodes(context.exclude);
    }
  } else {
    contextInclude = contextPropToNodes(context);
  }

  return {
    include: contextInclude,
    exclude: contextExclude
  };
}
