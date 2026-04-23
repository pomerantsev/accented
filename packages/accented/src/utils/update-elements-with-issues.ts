import type { Signal } from '@preact/signals-core';
import { batch, signal } from '@preact/signals-core';
import type { AxeResults } from 'axe-core';
import { descendantDependantRules } from '../constants.js';
import type { AccentedDialog } from '../elements/accented-dialog.ts';
import type { AccentedTrigger } from '../elements/accented-trigger.ts';
import type {
  BaseElementWithIssues,
  ElementWithIssues,
  ExtendedElementWithIssues,
  Issue,
  ScanContext,
} from '../types.ts';
import { areElementsWithIssuesEqual } from './are-elements-with-issues-equal.js';
import { areIssueSetsEqual } from './are-issue-sets-equal.js';
import { isSvgElement } from './dom-helpers.js';
import { getElementPosition } from './get-element-position.js';
import { getParent } from './get-parent.js';
import { getScrollableAncestors } from './get-scrollable-ancestors.js';
import { isNodeInScanContext } from './is-node-in-scan-context.js';
import { supportsAnchorPositioning } from './supports-anchor-positioning.js';
import { transformViolations } from './transform-violations.js';

function issuesInList(
  element: BaseElementWithIssues,
  list: Array<ElementWithIssues>,
): Array<Issue> {
  return list.find((e) => areElementsWithIssuesEqual(e, element))?.issues ?? [];
}

function shouldSkipRender(element: Element): boolean {
  // Skip rendering if the element is inside an SVG:
  // https://github.com/pomerantsev/accented/issues/62
  const parent = getParent(element);
  const isInsideSvg = Boolean(parent && isSvgElement(parent));

  // Some issues, such as meta-viewport, are on <head> descendants,
  // but since <head> is never rendered, we don't want to output anything
  // for those in the DOM.
  // We're not anticipating the use of shadow DOM in <head>,
  // so the use of .closest() should be fine.
  const isInsideHead = element.closest('head') !== null;

  return isInsideSvg || isInsideHead;
}

let count = 0;

export function updateElementsWithIssues({
  extendedElementsWithIssues,
  limitedContext,
  limitedContextViolations,
  fullContextViolations,
  name,
}: {
  extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>>;
  limitedContext: ScanContext;
  limitedContextViolations: typeof AxeResults.violations;
  fullContextViolations: typeof AxeResults.violations;
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
            .filter((addedElementWithIssues) => addedElementWithIssues.element.isConnected)
            .map((addedElementWithIssues) => {
              const id = count++;
              const trigger = document.createElement(`${name}-trigger`) as AccentedTrigger;
              const elementZIndex = Number.parseInt(
                getComputedStyle(addedElementWithIssues.element).zIndex,
                10,
              );
              if (!Number.isNaN(elementZIndex)) {
                trigger.style.setProperty('z-index', (elementZIndex + 1).toString(), 'important');
              }
              trigger.style.setProperty('position-anchor', `--${name}-anchor-${id}`, 'important');
              trigger.dataset.id = id.toString();
              const accentedDialog = document.createElement(`${name}-dialog`) as AccentedDialog;
              trigger.dialog = accentedDialog;
              const position = getElementPosition(addedElementWithIssues.element);
              trigger.position = signal(position);
              trigger.visible = signal(true);
              trigger.element = addedElementWithIssues.element;
              const scrollableAncestors = supportsAnchorPositioning()
                ? new Set<HTMLElement>()
                : getScrollableAncestors(addedElementWithIssues.element);
              const issues = signal(addedElementWithIssues.issues);
              accentedDialog.issues = issues;
              accentedDialog.element = addedElementWithIssues.element;
              return {
                id,
                element: addedElementWithIssues.element,
                skipRender: shouldSkipRender(addedElementWithIssues.element),
                rootNode: addedElementWithIssues.rootNode,
                visible: trigger.visible,
                position: trigger.position,
                scrollableAncestors: signal(scrollableAncestors),
                anchorNameValue:
                  addedElementWithIssues.element.style.getPropertyValue('anchor-name') ||
                  getComputedStyle(addedElementWithIssues.element).getPropertyValue('anchor-name'),
                trigger,
                issues,
              };
            }),
        );
    }
  });
}
