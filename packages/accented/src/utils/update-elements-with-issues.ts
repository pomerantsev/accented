import type { AxeResults } from 'axe-core';
import type { Signal } from '@preact/signals-core';
import { batch, signal } from '@preact/signals-core';
import type { ExtendedElementWithIssues } from '../types';
import transformViolations from './transform-violations.js';
import areIssueSetsEqual from './are-issue-sets-equal.js';
import type { AccentedTrigger } from '../elements/accented-trigger';
import type { AccentedDialog } from '../elements/accented-dialog';

let count = 0;

export default function updateElementsWithIssues(extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>>, violations: typeof AxeResults.violations, win: Window, name: string) {
  const updatedElementsWithIssues = transformViolations(violations);

  batch(() => {
    for (const updatedElementWithIssues of updatedElementsWithIssues) {
      const existingElementIndex = extendedElementsWithIssues.value.findIndex(extendedElementWithIssues => extendedElementWithIssues.element === updatedElementWithIssues.element);
      if (existingElementIndex > -1 && extendedElementsWithIssues.value[existingElementIndex] && !areIssueSetsEqual(extendedElementsWithIssues.value[existingElementIndex].issues.value, updatedElementWithIssues.issues)) {
        extendedElementsWithIssues.value[existingElementIndex].issues.value = updatedElementWithIssues.issues;
      }
    }

    const addedElementsWithIssues = updatedElementsWithIssues.filter(updatedElementWithIssues => {
      return !extendedElementsWithIssues.value.some(extendedElementWithIssues => extendedElementWithIssues.element === updatedElementWithIssues.element);
    });

    const removedElementsWithIssues = extendedElementsWithIssues.value.filter(extendedElementWithIssues => {
      return !updatedElementsWithIssues.some(updatedElementWithIssues => updatedElementWithIssues.element === extendedElementWithIssues.element);
    });

    if (addedElementsWithIssues.length > 0 || removedElementsWithIssues.length > 0) {
      extendedElementsWithIssues.value = [...extendedElementsWithIssues.value]
        .filter(extendedElementWithIssues => {
          return !removedElementsWithIssues.some(removedElementWithIssues => removedElementWithIssues.element === extendedElementWithIssues.element);
        })
        .concat(addedElementsWithIssues.map(addedElementWithIssues => {
          const id = count++;
          const trigger = win.document.createElement(`${name}-trigger`) as AccentedTrigger;
          const elementZIndex = parseInt(win.getComputedStyle(addedElementWithIssues.element).zIndex, 10);
          if (!isNaN(elementZIndex)) {
            trigger.style.setProperty('z-index', (elementZIndex + 1).toString());
          }
          trigger.style.setProperty('position-anchor', `--${name}-anchor-${id}`);
          trigger.dataset.id = id.toString();
          const accentedDialog = win.document.createElement(`${name}-dialog`) as AccentedDialog;
          trigger.dialog = accentedDialog;
          const issues = signal(addedElementWithIssues.issues);
          accentedDialog.issues = issues;
          return {
            id,
            element: addedElementWithIssues.element,
            trigger,
            issues
          };
        }));
    }
  });
}
