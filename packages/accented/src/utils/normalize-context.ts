import type { Context, ContextProp, ScanContext, Selector } from '../types.ts';
import { deduplicateNodes } from './deduplicate-nodes.js';
import { isNode, isNodeList } from './dom-helpers.js';
import { isNonEmpty } from './is-non-empty.js';

function recursiveSelectAll(
  selectors: [string, ...string[]],
  root: Document | ShadowRoot,
): Array<Node> {
  const nodesOnCurrentLevel = root.querySelectorAll(selectors[0]);
  if (selectors.length === 1) {
    return Array.from(nodesOnCurrentLevel);
  }
  const restSelectors: Array<string> = selectors.slice(1);
  if (!isNonEmpty(restSelectors)) {
    throw new Error('Error: the restSelectors array must not be empty.');
  }
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
  }
  if (isNode(selector)) {
    return [selector];
  }
  return recursiveSelectAll(selector.fromShadowDom, document);
}

function contextPropToNodes(contextProp: ContextProp): Array<Node> {
  let nodes: Array<Node> = [];
  if (typeof contextProp === 'object' && (Array.isArray(contextProp) || isNodeList(contextProp))) {
    nodes = Array.from(contextProp).flatMap((item) => selectorToNodes(item));
  } else {
    nodes = selectorToNodes(contextProp);
  }
  return deduplicateNodes(nodes);
}

export function normalizeContext(context: Context): ScanContext {
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
    exclude: contextExclude,
  };
}
