import type { ElementWithIssues, Issue } from '../types';

const issueProps: Array<keyof Issue> = ['id', 'title', 'description', 'url', 'impact'];

export default function areElementsWithIssuesEqual(elementsWithIssues1: Array<ElementWithIssues>, elementsWithIssues2: Array<ElementWithIssues>) {
  const sameSize = elementsWithIssues1.length === elementsWithIssues2.length;
  if (!sameSize) {
    return false;
  }

  for (const elementWithIssues of elementsWithIssues1) {
    const sameElementWithIssues = elementsWithIssues2.find(ewi2 =>
      ewi2.element === elementWithIssues.element &&
        ewi2.issues.every(issue2 => Boolean(elementWithIssues.issues.find(issue1 =>
          issueProps.every(prop => issue2[prop] === issue1[prop])
        )))
    );

    if (!sameElementWithIssues) {
      return false;
    }
  }

  return true;
}
