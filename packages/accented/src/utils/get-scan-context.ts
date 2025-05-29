import type { Context, ScanContext } from '../types.ts';
import contains from './contains.js';
import { deduplicateNodes } from './deduplicate-nodes.js';
import isNodeInScanContext from './is-node-in-scan-context.js';
import normalizeContext from './normalize-context.js';

export default function getScanContext(nodes: Array<Node>, context: Context): ScanContext {
  const { include: contextInclude, exclude: contextExclude } = normalizeContext(context);

  // Filter only nodes that are included by context (see isNodeInContext above).
  const nodesInContext = nodes.filter((node) =>
    isNodeInScanContext(node, {
      include: contextInclude,
      exclude: contextExclude,
    }),
  );

  const include: Array<Node> = [];
  const exclude: Array<Node> = [];

  // Adds all nodesInContext to the include array.
  include.push(...nodesInContext);

  // Now add any included and excluded context nodes that are contained by any of the original nodes.
  for (const node of nodes) {
    const includeDescendants = contextInclude.filter((item) => contains(node, item));
    include.push(...includeDescendants);
    const excludeDescendants = contextExclude.filter((item) => contains(node, item));
    exclude.push(...excludeDescendants);
  }

  return {
    include: deduplicateNodes(include),
    exclude: deduplicateNodes(exclude),
  };
}
