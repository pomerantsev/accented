import type { ScanContext } from '../types';
import contains from './contains.js';

// TODO: this implementation is incomplete
export default function isNodeInScanContext(node: Node, scanContext: ScanContext) {
  return scanContext.include.some(includedNode => contains(includedNode, node));
}
