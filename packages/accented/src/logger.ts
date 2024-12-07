import { effect } from '@preact/signals-core';
import { elements } from './state.js';
import uniqueArraysContainSameElements from './utils/unique-arrays-contain-same-elements.js';

export default function createLogger(outputToConsole: boolean) {
  let previousElements: Array<Element> = [];
  return effect(() => {
    if (outputToConsole && !uniqueArraysContainSameElements(previousElements, elements.value)) {
      console.log('Elements:', elements.value);
    }
    previousElements = [...elements.value];
  });
}
