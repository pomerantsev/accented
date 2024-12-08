import { effect } from '@preact/signals-core';
import { elements } from './state.js';
import areSetsEqual from './utils/are-sets-equal.js';

export default function createLogger(outputToConsole: boolean) {
  let previousElements: Array<Element> = [];
  return effect(() => {
    if (outputToConsole && !areSetsEqual(new Set(previousElements), new Set(elements.value))) {
      console.log('Elements:', elements.value);
    }
    previousElements = [...elements.value];
  });
}
