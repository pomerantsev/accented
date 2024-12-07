import { effect } from '@preact/signals-core';
import { elements } from './state.js';

// TODO: implement order-independent comparison
function haveElementsChanged(previousElements: Array<Element>, currentElements: Array<Element>) {
  return previousElements.some((elem, index) => elem !== currentElements[index]) ||
    currentElements.some((elem, index) => elem !== previousElements[index])
}

export default function createLogger(outputToConsole: boolean) {
  let previousElements: Array<Element> = [];
  return effect(() => {

    if (outputToConsole && haveElementsChanged(previousElements, elements.value)) {
      console.log('Elements:', elements.value);
    }
    previousElements = [...elements.value];
  });
}
