import { effect } from '@preact/signals-core';
import { elementsWithIssues } from './state.js';

const accentedUrl = 'https://www.npmjs.com/package/accented';

export default function createLogger() {

  let firstRun = true;

  return effect(() => {
    if (elementsWithIssues.value.length > 0) {
      console.log(`Elements with accessibility issues, identified by Accented (${accentedUrl}):\n`, elementsWithIssues.value);
    } else {
      if (firstRun) {
        firstRun = false;
      } else {
        console.log(`No elements with accessibility issues identified by Accented (${accentedUrl}).`);
      }
    }
  });
}
