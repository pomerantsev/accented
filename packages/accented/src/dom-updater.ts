import { effect } from '@preact/signals-core';
import { elementsWithIssues } from './state.js';
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

  let previousElementsWithIssues: Array<ElementWithIssues> = [];

  document.adoptedStyleSheets.push(stylesheet);
  const removeStylesheet = () => {
    if (document.adoptedStyleSheets.includes(stylesheet)) {
      document.adoptedStyleSheets.splice(document.adoptedStyleSheets.indexOf(stylesheet), 1);
    }
  };

  function update() {
    const addedElementsWithIssues = elementsWithIssues.value.filter(elementWithIssues => {
      return !previousElementsWithIssues.some(previousElementWithIssues => previousElementWithIssues.element === elementWithIssues.element);
    });
    const removedElementsWithIssues = previousElementsWithIssues.filter(previousElementWithIssues => {
      return !elementsWithIssues.value.some(elementWithIssues => elementWithIssues.element === previousElementWithIssues.element);
    });
    removeIssues(removedElementsWithIssues);
    setIssues(addedElementsWithIssues);
    previousElementsWithIssues = [...elementsWithIssues.value];
  }

  // Running update twice to ensure that it's run on disposal as well.
  const disposeOfElementsEffect = effect(() => {
    update();
    return () => {
      update();
    };
  });

  return () => {
    removeStylesheet();
    disposeOfElementsEffect();
  };
}
