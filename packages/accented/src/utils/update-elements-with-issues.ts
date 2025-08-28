import type { Signal } from '@preact/signals-core';
import { batch, signal } from '@preact/signals-core';
import type { AxeResults } from 'axe-core';
import type { AccentedDialog } from '../elements/accented-dialog.ts';
import type { AccentedTrigger } from '../elements/accented-trigger.ts';
import type { ExtendedElementWithIssues, ScanContext } from '../types.ts';
import { areElementsWithIssuesEqual } from './are-elements-with-issues-equal.js';
import { areIssueSetsEqual } from './are-issue-sets-equal.js';
import { isSvgElement } from './dom-helpers.js';
import { getElementPosition } from './get-element-position.js';
import { getParent } from './get-parent.js';
import { getScrollableAncestors } from './get-scrollable-ancestors.js';
import { isNodeInScanContext } from './is-node-in-scan-context.js';
import { supportsAnchorPositioning } from './supports-anchor-positioning.js';
import { transformViolations } from './transform-violations.js';

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
  scanContext,
  violations,
  name,
}: {
  extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>>;
  scanContext: ScanContext;
  violations: typeof AxeResults.violations;
  name: string;
}) {
  const updatedElementsWithIssues = transformViolations(violations, name);

  batch(() => {
    for (const updatedElementWithIssues of updatedElementsWithIssues) {
      const existingElementIndex = extendedElementsWithIssues.value.findIndex(
        (extendedElementWithIssues) =>
          areElementsWithIssuesEqual(extendedElementWithIssues, updatedElementWithIssues),
      );
      if (
        existingElementIndex > -1 &&
        extendedElementsWithIssues.value[existingElementIndex] &&
        !areIssueSetsEqual(
          extendedElementsWithIssues.value[existingElementIndex].issues.value,
          updatedElementWithIssues.issues,
        )
      ) {
        extendedElementsWithIssues.value[existingElementIndex].issues.value =
          updatedElementWithIssues.issues;
      }
    }

    const addedElementsWithIssues = updatedElementsWithIssues.filter((updatedElementWithIssues) => {
      return !extendedElementsWithIssues.value.some((extendedElementWithIssues) =>
        areElementsWithIssuesEqual(extendedElementWithIssues, updatedElementWithIssues),
      );
    });

    // Only consider an element to be removed in two cases:
    // 1. It has been removed from the DOM.
    // 2. It is within the scan context, but not among updatedElementsWithIssues.
    const removedElementsWithIssues = extendedElementsWithIssues.value.filter(
      (extendedElementWithIssues) => {
        const isConnected = extendedElementWithIssues.element.isConnected;
        const hasNoMoreIssues =
          isNodeInScanContext(extendedElementWithIssues.element, scanContext) &&
          !updatedElementsWithIssues.some((updatedElementWithIssues) =>
            areElementsWithIssuesEqual(updatedElementWithIssues, extendedElementWithIssues),
          );
        return !isConnected || hasNoMoreIssues;
      },
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
