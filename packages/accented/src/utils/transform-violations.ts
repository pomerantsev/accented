import type { AxeResults, ImpactValue } from 'axe-core';
import type { Issue, ElementWithIssues } from '../types';

function impactCompare(a: ImpactValue, b: ImpactValue) {
  const impactOrder = [null, 'minor', 'moderate', 'serious', 'critical'];
  return impactOrder.indexOf(a) - impactOrder.indexOf(b);
}

export default function transformViolations(violations: typeof AxeResults.violations) {
  const elementsWithIssues: Array<ElementWithIssues> = [];

  for (const violation of violations) {
    for (const node of violation.nodes) {
      const { element, target } = node;

      // Although axe-core can perform iframe scanning, I haven't succeeded in it,
      // and the docs suggest that the axe-core script should be explicitly included
      // in each of the iframed documents anyway.
      // It seems preferable to disallow iframe scanning and not report issues in elements within iframes
      // in the case that such issues are for some reason reported by axe-core.
      // A consumer of Accented can instead scan the iframed document by calling Accented initialization from that document.
      const isInIframe = target.length > 1;

      // Highlighting elements in shadow DOM is not yet supported, see https://github.com/pomerantsev/accented/issues/25
      // Until then, we don’t want such elements to be added to the set.
      const isInShadowDOM = Array.isArray(target[0]);

      if (element && !isInIframe && !isInShadowDOM) {
        const issue: Issue = {
          id: violation.id,
          title: violation.help,
          description: node.failureSummary ?? violation.description,
          url: violation.helpUrl,
          impact: violation.impact ?? null
        };
        const existingElementIndex = elementsWithIssues.findIndex(elementWithIssues => elementWithIssues.element === element);
        if (existingElementIndex === -1) {
          elementsWithIssues.push({
            element,
            issues: [issue]
          });
        } else {
          elementsWithIssues[existingElementIndex]!.issues.push(issue);
        }
      }
    }
  }

  for (const elementWithIssues of elementsWithIssues) {
    elementWithIssues.issues.sort((a, b) => {
      return -impactCompare(a.impact, b.impact) || a.id.localeCompare(b.id);
    });
  }

  return elementsWithIssues;
}
