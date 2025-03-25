import type { AxeResults } from 'axe-core';
import type { Signal } from '@preact/signals-core';
import { batch, signal } from '@preact/signals-core';
import type { ExtendedElementWithIssues } from '../types';
import transformViolations from './transform-violations.js';
import areElementsWithIssuesEqual from './are-elements-with-issues-equal.js';
import areIssueSetsEqual from './are-issue-sets-equal.js';
import type { AccentedTrigger } from '../elements/accented-trigger';
import type { AccentedDialog } from '../elements/accented-dialog';
import getElementPosition from './get-element-position.js';
import getScrollableAncestors from './get-scrollable-ancestors.js';
import supportsAnchorPositioning from './supports-anchor-positioning.js';

let count = 0;

export default function updateElementsWithIssues(extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>>, violations: typeof AxeResults.violations, win: Window & { CSS: typeof CSS }, name: string) {
  const updatedElementsWithIssues = transformViolations(violations, name);

  batch(() => {
    for (const updatedElementWithIssues of updatedElementsWithIssues) {
      const existingElementIndex = extendedElementsWithIssues.value.findIndex(extendedElementWithIssues => areElementsWithIssuesEqual(extendedElementWithIssues, updatedElementWithIssues));
      if (existingElementIndex > -1 && extendedElementsWithIssues.value[existingElementIndex] && !areIssueSetsEqual(extendedElementsWithIssues.value[existingElementIndex].issues.value, updatedElementWithIssues.issues)) {
        extendedElementsWithIssues.value[existingElementIndex].issues.value = updatedElementWithIssues.issues;
      }
    }

    const addedElementsWithIssues = updatedElementsWithIssues.filter(updatedElementWithIssues => {
      return !extendedElementsWithIssues.value.some(extendedElementWithIssues => areElementsWithIssuesEqual(extendedElementWithIssues, updatedElementWithIssues));
    });

    const removedElementsWithIssues = extendedElementsWithIssues.value.filter(extendedElementWithIssues => {
      return !updatedElementsWithIssues.some(updatedElementWithIssues => areElementsWithIssuesEqual(updatedElementWithIssues, extendedElementWithIssues));
    });

    if (addedElementsWithIssues.length > 0 || removedElementsWithIssues.length > 0) {
      extendedElementsWithIssues.value = [...extendedElementsWithIssues.value]
        .filter(extendedElementWithIssues => {
          return !removedElementsWithIssues.some(removedElementWithIssues => areElementsWithIssuesEqual(removedElementWithIssues, extendedElementWithIssues));
        })
        .concat(addedElementsWithIssues
          .filter(addedElementWithIssues => addedElementWithIssues.element.isConnected)
          .map(addedElementWithIssues => {
            const id = count++;
            const trigger = win.document.createElement(`${name}-trigger`) as AccentedTrigger;
            const elementZIndex = parseInt(win.getComputedStyle(addedElementWithIssues.element).zIndex, 10);
            if (!isNaN(elementZIndex)) {
              trigger.style.setProperty('z-index', (elementZIndex + 1).toString(), 'important');
            }
            trigger.style.setProperty('position-anchor', `--${name}-anchor-${id}`, 'important');
            trigger.dataset.id = id.toString();
            const accentedDialog = win.document.createElement(`${name}-dialog`) as AccentedDialog;
            trigger.dialog = accentedDialog;
            const position = getElementPosition(addedElementWithIssues.element, win);
            trigger.position = signal(position);
            trigger.visible = signal(true);
            trigger.element = addedElementWithIssues.element;
            const scrollableAncestors = supportsAnchorPositioning(win) ?
              new Set<HTMLElement>() :
              getScrollableAncestors(addedElementWithIssues.element, win);
            const issues = signal(addedElementWithIssues.issues);
            accentedDialog.issues = issues;
            accentedDialog.element = addedElementWithIssues.element;
            return {
              id,
              element: addedElementWithIssues.element,
              rootNode: addedElementWithIssues.rootNode,
              visible: trigger.visible,
              position: trigger.position,
              scrollableAncestors: signal(scrollableAncestors),
              anchorNameValue:
                addedElementWithIssues.element.style.getPropertyValue('anchor-name')
                || win.getComputedStyle(addedElementWithIssues.element).getPropertyValue('anchor-name'),
              trigger,
              issues
            };
          })
        );
    }
  });
}
