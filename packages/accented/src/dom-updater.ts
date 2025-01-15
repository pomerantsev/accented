import { effect } from '@preact/signals-core';
import { computedElementsWithIssues } from './state.js';
import type { ElementWithIssues } from './types';

export default function createDomUpdater(name: string) {
  const attrName = `data-${name}`;

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

  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`
    @layer ${name} {
      :root {
        --${name}-primary-color: red;
        --${name}-outline-width: 2px;
        --${name}-outline-style: solid;
      }

      [${attrName}]:not(:focus-visible) {
        outline-width: var(--${name}-outline-width) !important;
        outline-offset: calc(-1 * var(--${name}-outline-width)) !important;
        outline-color: var(--${name}-primary-color) !important;
        outline-style: var(--${name}-outline-style) !important;
      }
    }
  `);

  // TODO: can we get access to the previous value in a different fashion?
  let previousElementsWithIssues: Array<ElementWithIssues> = [];

  document.adoptedStyleSheets.push(stylesheet);
  const removeStylesheet = () => {
    if (document.adoptedStyleSheets.includes(stylesheet)) {
      document.adoptedStyleSheets.splice(document.adoptedStyleSheets.indexOf(stylesheet), 1);
    }
  };

  const disposeOfElementsEffect = effect(() => {
    // console.log('Calling the effect');
    // removeIssues(previousElementsWithIssues);
    setIssues(computedElementsWithIssues.value);
    previousElementsWithIssues = [...computedElementsWithIssues.value];
    return () => {
      // console.log('Value in the return function:', computedElementsWithIssues.value.length);
      removeIssues(previousElementsWithIssues);
    };
  });

  return () => {
    removeStylesheet();
    disposeOfElementsEffect();
  };
}
