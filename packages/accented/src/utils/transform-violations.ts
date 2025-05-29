import type { AxeResults, ImpactValue } from 'axe-core';
import type { ElementWithIssues, Issue } from '../types.ts';

// This is a list of axe-core violations (their ids) that may be flagged by axe-core
// as false positives if an Accented trigger is a descendant of the element with the issue.
const violationsAffectedByAccentedTriggers = [
  'aria-hidden-focus',
  'aria-text',
  'definition-list',
  'label-content-name-mismatch',
  'list',
  'nested-interactive',
  'scrollable-region-focusable', // The Accented trigger might make the content grow such that scrolling is required.
];

function maybeCausedByAccented(violationId: string, element: HTMLElement, name: string) {
  return (
    violationsAffectedByAccentedTriggers.includes(violationId) &&
    Boolean(element.querySelector(`${name}-trigger`))
  );
}

function impactCompare(a: ImpactValue, b: ImpactValue) {
  const impactOrder = [null, 'minor', 'moderate', 'serious', 'critical'];
  return impactOrder.indexOf(a) - impactOrder.indexOf(b);
}

export default function transformViolations(
  violations: typeof AxeResults.violations,
  name: string,
) {
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

      if (element && !isInIframe && !maybeCausedByAccented(violation.id, element, name)) {
        const issue: Issue = {
          id: violation.id,
          title: violation.help,
          description: node.failureSummary ?? violation.description,
          url: violation.helpUrl,
          impact: violation.impact ?? null,
        };
        const existingElement = elementsWithIssues.find(
          (elementWithIssues) => elementWithIssues.element === element,
        );
        if (existingElement === undefined) {
          elementsWithIssues.push({
            element,
            rootNode: element.getRootNode(),
            issues: [issue],
          });
        } else {
          existingElement.issues.push(issue);
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
