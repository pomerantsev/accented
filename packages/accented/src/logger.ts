import { effect } from '@preact/signals-core';
import { computedElementsWithIssues } from './state.js';

const accentedUrl = 'https://www.npmjs.com/package/accented';

export default function createLogger() {

  let firstRun = true;

  return effect(() => {
    if (computedElementsWithIssues.value.length > 0) {
      if (firstRun) {
        firstRun = false;
      } else {
        console.log(`Elements with accessibility issues, identified by Accented (${accentedUrl}):\n`, computedElementsWithIssues.value);
      }
    } else {
      if (firstRun) {
        firstRun = false;
      } else {
        console.log(`No elements with accessibility issues identified by Accented (${accentedUrl}).`);
      }
    }
  });
}
