import { effect } from '@preact/signals-core';
import { elementsWithIssues } from './state.js';
import areElementsWithIssuesEqual from './utils/are-elements-with-issues-equal.js';
import type { ElementWithIssues } from './types.js';

const accentedUrl = 'https://www.npmjs.com/package/accented';

export default function createLogger() {
  let previousElementsWithIssues: Array<ElementWithIssues> = [];
  return effect(() => {
    if (!areElementsWithIssuesEqual(previousElementsWithIssues, elementsWithIssues.value)) {
      console.log(`Elements with accessibility issues, identified by Accented (${accentedUrl}):\n`, elementsWithIssues.value);
    }
    previousElementsWithIssues = [...elementsWithIssues.value];
  });
}
