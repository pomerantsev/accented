import type { AxeResults } from 'axe-core';
import type { Signal } from '@preact/signals-core';
import { batch, signal } from '@preact/signals-core';
import type { ExtendedElementWithIssues } from '../types';
import transformViolations from './transform-violations.js';
import areIssueSetsEqual from './are-issue-sets-equal.js';
import type AccentedContainer from '../elements/accented-container';

let count = 0;

export default function updateElementsWithIssues(extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>>, violations: typeof AxeResults.violations, doc: Document, name: string) {
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
          const accentedContainer = doc.createElement(`${name}-container`) as AccentedContainer;
          accentedContainer.popover = 'manual';
          accentedContainer.style.setProperty('position-anchor', `--${name}-anchor-${id}`);
          const issues = signal(addedElementWithIssues.issues);
          accentedContainer.issues = issues;
          return {
            id,
            element: addedElementWithIssues.element,
            accentedContainer,
            issues
          };
        }));
    }
  });
}
