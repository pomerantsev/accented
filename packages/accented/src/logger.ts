import { effect } from '@preact/signals-core';
import { accentedUrl } from './constants.js';
import { elementsWithIssues, enabled } from './state.js';
import type { ElementWithIssues } from './types.ts';

function filterPropsForOutput(elements: Array<ElementWithIssues>) {
  return elements.map(({ element, issues }) => ({ element, issues }));
}

export function createLogger() {
  let firstRun = true;

  return effect(() => {
    if (!enabled.value) {
      return;
    }

    const elementCount = elementsWithIssues.value.length;
    if (elementCount > 0) {
      const issueCount = elementsWithIssues.value.reduce(
        (acc, { issues }) => acc + issues.length,
        0,
      );
      console.log(
        `${issueCount} accessibility issue${issueCount === 1 ? '' : 's'} found in ${elementCount} element${issueCount === 1 ? '' : 's'} (Accented, ${accentedUrl}):\n`,
        filterPropsForOutput(elementsWithIssues.value),
      );
    } else {
      if (firstRun) {
        firstRun = false;
      } else {
        console.log(`No accessibility issues found (Accented, ${accentedUrl}).`);
      }
    }
  });
}
