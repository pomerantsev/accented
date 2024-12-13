import { effect } from '@preact/signals-core';
import { elements } from './state.js';

const attrName = 'data-accented';

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
  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`
    [${attrName}]:not(:focus-visible) {
      outline: 2px solid red !important;
      outline-offset: -2px;
    }
  `);

  let previousElements: Array<Element> = [];

  document.adoptedStyleSheets.push(stylesheet);
  const removeStylesheet = () => {
    if (document.adoptedStyleSheets.includes(stylesheet)) {
      document.adoptedStyleSheets.splice(document.adoptedStyleSheets.indexOf(stylesheet), 1);
    }
  };

  const disposeOfElementsEffect = effect(() => {
    removeIssues(previousElements);
    setIssues(elements.value);
    previousElements = [...elements.value];
    return () => {
      removeIssues(previousElements);
    };
  });

  return () => {
    removeStylesheet();
    disposeOfElementsEffect();
  };
}
