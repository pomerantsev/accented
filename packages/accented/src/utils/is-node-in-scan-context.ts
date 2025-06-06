/* Adapted from https://github.com/dequelabs/axe-core/blob/fd6239bfc97ebc904044f93f68d7e49137f744ad/lib/core/utils/is-node-in-context.js */

import type { ScanContext } from '../types.ts';
import { contains } from './contains.js';
import { ensureNonEmpty } from './ensure-non-empty.js';

function getDeepest(nodes: [Node, ...Node[]]): Node {
  let deepest = nodes[0];
  for (const node of nodes.slice(1)) {
    if (!contains(node, deepest)) {
      deepest = node;
    }
  }
  return deepest;
}

export function isNodeInScanContext(node: Node, { include, exclude }: ScanContext): boolean {
  const filteredInclude = include.filter((includeNode) => contains(includeNode, node));
  if (filteredInclude.length === 0) {
    return false;
  }
  const filteredExclude = exclude.filter((excludeNode) => contains(excludeNode, node));
  if (filteredExclude.length === 0) {
    return true;
  }
  const deepestInclude = getDeepest(ensureNonEmpty(filteredInclude));
  const deepestExclude = getDeepest(ensureNonEmpty(filteredExclude));
  return contains(deepestExclude, deepestInclude);
}
