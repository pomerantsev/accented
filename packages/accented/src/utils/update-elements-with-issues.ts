import type { Signal } from '@preact/signals-core';
import { batch } from '@preact/signals-core';
import type { AxeResults } from 'axe-core';
import { descendantDependentRules } from '../constants.js';
import type {
  BaseElementWithIssues,
  ElementWithIssues,
  ExtendedElementWithIssues,
  Issue,
  ScanContext,
} from '../types.ts';
import { areElementsWithIssuesEqual } from './are-elements-with-issues-equal.js';
import { areIssueSetsEqual } from './are-issue-sets-equal.js';
import { createExtendedElementWithIssues } from './create-extended-element-with-issues.js';
import { isNodeInScanContext } from './is-node-in-scan-context.js';
import { transformViolations } from './transform-violations.js';

function getIssuesForElement(
  element: BaseElementWithIssues,
  list: Array<ElementWithIssues>,
): Array<Issue> {
  return list.find((entry) => areElementsWithIssuesEqual(entry, element))?.issues ?? [];
}

function mergeLimitedContextAndFullContextViolations(
  elementsFromLimitedContext: Array<ElementWithIssues>,
  elementsFromFullContext: Array<ElementWithIssues>,
): Array<ElementWithIssues> {
  const fromLimitedWithFullIssuesMerged = elementsFromLimitedContext.map((limited) => {
    const fullMatch = elementsFromFullContext.find((full) =>
      areElementsWithIssuesEqual(full, limited),
    );
    return fullMatch ? { ...limited, issues: [...limited.issues, ...fullMatch.issues] } : limited;
  });
  const onlyInFullContext = elementsFromFullContext.filter(
    (full) =>
      !elementsFromLimitedContext.some((limited) => areElementsWithIssuesEqual(limited, full)),
  );
  return [...fromLimitedWithFullIssuesMerged, ...onlyInFullContext];
}

export function updateElementsWithIssues({
  extendedElementsWithIssues,
  limitedContext,
  limitedContextViolations,
  fullContextViolations,
  name,
}: {
  extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>>;
  limitedContext: ScanContext;
  limitedContextViolations: AxeResults['violations'];
  fullContextViolations: AxeResults['violations'];
  name: string;
}) {
  const updatedElementsFromLimitedContext = transformViolations(limitedContextViolations, name);
  const updatedElementsFromFullContext = transformViolations(fullContextViolations, name);

  const allUpdatedElements = mergeLimitedContextAndFullContextViolations(
    updatedElementsFromLimitedContext,
    updatedElementsFromFullContext,
  );

  batch(() => {
    for (const existing of extendedElementsWithIssues.value) {
      // If the element is inside the limited context, axe just rescanned
      // it — replace its issues with whatever was reported. If it's outside, keep its
      // existing issues, except descendant-dependent ones, which may have changed due
      // to mutations elsewhere; those get repopulated from the full-context scan below.
      const newLimitedContextIssues = isNodeInScanContext(existing.element, limitedContext)
        ? getIssuesForElement(existing, updatedElementsFromLimitedContext)
        : existing.issues.value.filter((issue) => !descendantDependentRules.has(issue.id));

      const newFullContextIssues = getIssuesForElement(existing, updatedElementsFromFullContext);

      const newIssues = [...newLimitedContextIssues, ...newFullContextIssues];

      if (!areIssueSetsEqual(existing.issues.value, newIssues)) {
        existing.issues.value = newIssues;
      }
    }

    const addedElementsWithIssues = allUpdatedElements.filter(
      (updated) =>
        updated.element.isConnected &&
        !extendedElementsWithIssues.value.some((existing) =>
          areElementsWithIssuesEqual(existing, updated),
        ),
    );

    const removedElementsWithIssues = extendedElementsWithIssues.value.filter(
      (existing) => !existing.element.isConnected || existing.issues.value.length === 0,
    );

    // Only rebuild the outer signal when set membership changes; per-element issue
    // updates were already made in the loop above.
    if (addedElementsWithIssues.length > 0 || removedElementsWithIssues.length > 0) {
      extendedElementsWithIssues.value = [...extendedElementsWithIssues.value]
        .filter(
          (existing) =>
            !removedElementsWithIssues.some((removed) =>
              areElementsWithIssuesEqual(removed, existing),
            ),
        )
        .concat(
          addedElementsWithIssues.map((added) => createExtendedElementWithIssues(added, name)),
        );
    }
  });
}
