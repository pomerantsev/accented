import type { Signal } from '@preact/signals-core';
import { batch } from '@preact/signals-core';
import type { AxeResults } from 'axe-core';
import { descendantDependantRules } from '../constants.js';
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

function issuesInList(
  element: BaseElementWithIssues,
  list: Array<ElementWithIssues>,
): Array<Issue> {
  return list.find((e) => areElementsWithIssuesEqual(e, element))?.issues ?? [];
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

  const allUpdatedElements: Array<ElementWithIssues> = [
    ...updatedElementsFromLimitedContext,
    ...updatedElementsFromFullContext.filter(
      (e) => !updatedElementsFromLimitedContext.some((l) => areElementsWithIssuesEqual(l, e)),
    ),
  ].map((e) => ({
    ...e,
    issues: [
      ...issuesInList(e, updatedElementsFromLimitedContext),
      ...issuesInList(e, updatedElementsFromFullContext),
    ],
  }));

  batch(() => {
    for (const existing of extendedElementsWithIssues.value) {
      const newLimitedIssues = isNodeInScanContext(existing.element, limitedContext)
        ? issuesInList(existing, updatedElementsFromLimitedContext)
        : existing.issues.value.filter((issue) => !descendantDependantRules.has(issue.id));

      const newFullIssues = issuesInList(existing, updatedElementsFromFullContext);

      const newIssues = [...newLimitedIssues, ...newFullIssues];

      if (!areIssueSetsEqual(existing.issues.value, newIssues)) {
        existing.issues.value = newIssues;
      }
    }

    const addedElementsWithIssues = allUpdatedElements.filter((updatedElementWithIssues) => {
      return !extendedElementsWithIssues.value.some((extendedElementWithIssues) =>
        areElementsWithIssuesEqual(extendedElementWithIssues, updatedElementWithIssues),
      );
    });

    const removedElementsWithIssues = extendedElementsWithIssues.value.filter(
      (extendedElementWithIssues) =>
        !extendedElementWithIssues.element.isConnected ||
        extendedElementWithIssues.issues.value.length === 0,
    );

    if (addedElementsWithIssues.length > 0 || removedElementsWithIssues.length > 0) {
      extendedElementsWithIssues.value = [...extendedElementsWithIssues.value]
        .filter((extendedElementWithIssues) => {
          return !removedElementsWithIssues.some((removedElementWithIssues) =>
            areElementsWithIssuesEqual(removedElementWithIssues, extendedElementWithIssues),
          );
        })
        .concat(
          addedElementsWithIssues
            .filter((added) => added.element.isConnected)
            .map((added) => createExtendedElementWithIssues(added, name)),
        );
    }
  });
}
