/* Mostly copied from https://github.com/dequelabs/axe-core/blob/develop/lib/core/utils/is-node-in-context.js */

import type { ScanContext } from '../types';
import contains from './contains.js';
import ensureNonEmpty from './ensure-non-empty.js';

function getDeepest(nodes: [Node, ...Node[]]): Node {
  let deepest = nodes[0];
  for (const node of nodes.slice(1)) {
    if (!contains(node, deepest)) {
      deepest = node;
    }
  }
  return deepest;
}

export default function isNodeInScanContext(node: Node, { include, exclude }: ScanContext): boolean {
  const filterInclude = include.filter(candidate => contains(candidate, node));
  if (filterInclude.length === 0) {
    return false;
  }
  const filterExcluded = exclude.filter(candidate => contains(candidate, node));
  if (filterExcluded.length === 0) {
    return true;
  }
  const deepestInclude = getDeepest(ensureNonEmpty(filterInclude));
  const deepestExclude = getDeepest(ensureNonEmpty(filterExcluded));
  return contains(deepestExclude, deepestInclude);
}
