import { effect } from '@preact/signals-core';
import { elements } from './state.js';

const attrName = 'data-accented';

const stylesheet = new CSSStyleSheet();
await stylesheet.replace(`
  [${attrName}]:not(:focus-visible) {
    outline: 2px solid red !important;
    outline-offset: -2px;
  }
`);

function setIssues (elements: Array<Element>) {
  for (const element of elements) {
    element.setAttribute(attrName, '');
  }
}

function removeIssues (elements: Array<Element>) {
  for (const element of elements) {
    element.removeAttribute(attrName);
  }
}

// TODO: make this work with Shadow DOM and iframes
export default function createDomUpdater() {
  let previousElements: Array<Element> = [];
  const disposeOfStylesheetEffect = effect(() => {
    document.adoptedStyleSheets.push(stylesheet);
    return () => {
      if (document.adoptedStyleSheets.includes(stylesheet)) {
        document.adoptedStyleSheets.splice(document.adoptedStyleSheets.indexOf(stylesheet), 1);
      }
    };
  });

  const disposeOfElementsEffect = effect(() => {
    removeIssues(previousElements);
    setIssues(elements.value);
    previousElements = [...elements.value];
    return () => {
      removeIssues(previousElements);
    };
  });

  return () => {
    disposeOfStylesheetEffect();
    disposeOfElementsEffect();
  };
}
