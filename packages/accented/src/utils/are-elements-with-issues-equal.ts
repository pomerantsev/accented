import type { BaseElementWithIssues } from '../types.ts';

export default function areElementsWithIssuesEqual(
  elementWithIssues1: BaseElementWithIssues,
  elementWithIssues2: BaseElementWithIssues
) {
  return elementWithIssues1.element === elementWithIssues2.element
    && elementWithIssues1.rootNode === elementWithIssues2.rootNode;
}
