import type { AxeContext, ScanContext } from '../types';
import contains from './contains.js';
import { deduplicateNodes } from './deduplicate-nodes.js';
import isNodeInScanContext from './is-node-in-scan-context.js';
import normalizeContext from './normalize-context.js';

export default function getScanContext(nodes: Array<Node>, axeContext: AxeContext): ScanContext {
  const {
    include: axeContextInclude,
    exclude: axeContextExclude
  } = normalizeContext(axeContext);

  // Filter only nodes that are included by axeContext (see isNodeInContext above).
  const nodesInContext = nodes.filter(node =>
    isNodeInScanContext(node, {
      include: axeContextInclude,
      exclude: axeContextExclude
    })
  );

  const include: Array<Node> = [];
  const exclude: Array<Node> = [];

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
