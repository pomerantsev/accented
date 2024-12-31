import { effect } from '@preact/signals-core';
import { elementsWithIssues } from './state.js';
import areSetsEqual from './utils/are-sets-equal.js';
import type { ElementWithIssues } from './types.js';

const accentedUrl = 'https://www.npmjs.com/package/accented';

export default function createLogger() {
  let previousElementsWithIssues: Array<ElementWithIssues> | null = null;
  let runCount = 0;
  return effect(() => {
    console.log('Running the effect');
    runCount++;
    if (runCount === 1) {
      return;
    }
    if (previousElementsWithIssues === null || !areSetsEqual(previousElementsWithIssues, elementsWithIssues.value)) {
      if (elementsWithIssues.value.length === 0) {
        console.log(`No accessibility issues identified by Accented (${accentedUrl}).`);
      } else {
        console.log(`Elements with accessibility issues, identified by Accented (${accentedUrl}):`, elementsWithIssues.value);
      }
    }
    previousElementsWithIssues = [...elementsWithIssues.value];
  });
}
