import { effect } from '@preact/signals-core';
import { elementsWithIssues } from './state.js';
import type { ElementWithIssues } from './types';

const attrName = 'data-accented';

function setIssues (elementsWithIssues: Array<ElementWithIssues>) {
  for (const elementWithIssues of elementsWithIssues) {
    elementWithIssues.element.setAttribute(attrName, '');
  }
}

function removeIssues (elementsWithIssues: Array<ElementWithIssues>) {
  for (const elementWithIssues of elementsWithIssues) {
    elementWithIssues.element.removeAttribute(attrName);
  }
}

export default function createDomUpdater() {
  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`
    [${attrName}]:not(:focus-visible) {
      outline: 2px solid red !important;
      outline-offset: -2px;
    }
  `);

  let previousElementsWithIssues: Array<ElementWithIssues> = [];

  document.adoptedStyleSheets.push(stylesheet);
  const removeStylesheet = () => {
    if (document.adoptedStyleSheets.includes(stylesheet)) {
      document.adoptedStyleSheets.splice(document.adoptedStyleSheets.indexOf(stylesheet), 1);
    }
  };

  const disposeOfElementsEffect = effect(() => {
    removeIssues(previousElementsWithIssues);
    setIssues(elementsWithIssues.value);
    previousElementsWithIssues = [...elementsWithIssues.value];
    return () => {
      removeIssues(previousElementsWithIssues);
    };
  });

  return () => {
    removeStylesheet();
    disposeOfElementsEffect();
  };
}
