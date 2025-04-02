import type { AxeContext, ContextProp, Selector, ScanContext } from '../types';
import { isDocument, isDocumentFragment, isNode, isNodeList } from './dom-helpers.js';
import contains from './contains.js';
import { deduplicateNodes } from './deduplicate-nodes.js';
import isNodeInScanContext from './is-node-in-scan-context.js';

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
  if (axeContextInclude.length === 0) {
    axeContextInclude.push(document);
  }

  // Filter only nodes that are included by axeContext (see isNodeInContext above).
  const nodesInContext = nodes.filter(node =>
    isNodeInScanContext(node, {
      include: axeContextInclude,
      exclude: axeContextExclude
    })
  );

  // Adds all nodesInContext to the include array.
  include.push(...nodesInContext);

  // Now add any included and excluded context nodes that are contained by any of the original nodes.
  for (const node of nodes) {
    const includeDescendants = axeContextInclude.filter(item => contains(node, item));
    include.push(...includeDescendants);
    const excludeDescendants = axeContextExclude.filter(item => contains(node, item));
    exclude.push(...excludeDescendants);
  }

  return {
    include: deduplicateNodes(include, 'equality'),
    exclude: deduplicateNodes(exclude, 'equality')
  };
}
