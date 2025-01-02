import type { ElementWithIssues } from '../types';

import areIssueSetsEqual from './are-issue-sets-equal.js';

export default function areElementsWithIssuesEqual(elementsWithIssues1: Array<ElementWithIssues>, elementsWithIssues2: Array<ElementWithIssues>) {
  const sameSize = elementsWithIssues1.length === elementsWithIssues2.length;
  if (!sameSize) {
    return false;
  }

  for (const elementWithIssues of elementsWithIssues1) {
    const sameElementWithIssues = elementsWithIssues2.find(ewi2 =>
      ewi2.element === elementWithIssues.element &&
        areIssueSetsEqual(ewi2.issues, elementWithIssues.issues)
    );

    if (!sameElementWithIssues) {
      return false;
    }
  }

  return true;
}
