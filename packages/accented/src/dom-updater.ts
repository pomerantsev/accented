import { effect } from '@preact/signals-core';
import { extendedElementsWithIssues } from './state.js';
import type { ExtendedElementWithIssues } from './types';

export default function createDomUpdater(name: string) {
  const attrName = `data-${name}`;

  function setIssues (extendedElementsWithIssues: Array<ExtendedElementWithIssues>) {
    for (const elementWithIssues of extendedElementsWithIssues) {
      elementWithIssues.element.setAttribute(attrName, '');
      // TODO: this is only a prototype. We need to make this more robust by ensuring we don't break any existing functionality
      // (in case anchor-name is already set on the element, either in a stylesheet or inline).
      elementWithIssues.element.style.setProperty('anchor-name', `--${name}-anchor-${elementWithIssues.id}`);
      document.body.appendChild(elementWithIssues.accentedContainer);
    }
  }

  function removeIssues (extendedElementsWithIssues: Array<ExtendedElementWithIssues>) {
    for (const elementWithIssues of extendedElementsWithIssues) {
      elementWithIssues.element.removeAttribute(attrName);
      elementWithIssues.element.style.removeProperty('anchor-name');
      elementWithIssues.accentedContainer.remove();
    }
  }

  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`
    @layer ${name} {
      :root {
        --${name}-primary-color: red;
        --${name}-secondary-color: white;
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

  let previousExtendedElementsWithIssues: Array<ExtendedElementWithIssues> = [];

  document.adoptedStyleSheets.push(stylesheet);
  const removeStylesheet = () => {
    if (document.adoptedStyleSheets.includes(stylesheet)) {
      document.adoptedStyleSheets.splice(document.adoptedStyleSheets.indexOf(stylesheet), 1);
    }
  };

  const disposeOfElementsEffect = effect(() => {
    const added = extendedElementsWithIssues.value.filter(elementWithIssues => {
      return !previousExtendedElementsWithIssues.some(previousElementWithIssues => previousElementWithIssues.element === elementWithIssues.element);
    });
    const removed = previousExtendedElementsWithIssues.filter(previousElementWithIssues => {
      return !extendedElementsWithIssues.value.some(elementWithIssues => elementWithIssues.element === previousElementWithIssues.element);
    });
    removeIssues(removed);
    setIssues(added);
    previousExtendedElementsWithIssues = [...extendedElementsWithIssues.value];
  });

  return () => {
    removeStylesheet();
    disposeOfElementsEffect();
  };
}
