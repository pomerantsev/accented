import { effect } from '@preact/signals-core';
import { enabled, elements } from './state.js';

const attrName = 'data-accented';

const stylesheet = new CSSStyleSheet();
await stylesheet.replace(`
  [${attrName}]:not(:focus-visible) {
    outline: 2px solid red !important;
    outline-offset: -2px;
  }
`);

// TODO: make this work with Shadow DOM and iframes
export default function createDomUpdater() {
  let previousElements: Array<Element> = [];
  const disposeOfStylesheetEffect = effect(() => {
    if (enabled.value) {
      document.adoptedStyleSheets.push(stylesheet);
    } else {
      if (document.adoptedStyleSheets.includes(stylesheet)) {
        document.adoptedStyleSheets.splice(document.adoptedStyleSheets.indexOf(stylesheet), 1);
      }
    }
  });

  const disposeOfElementsEffect = effect(() => {
    for (const element of previousElements) {
      element.removeAttribute(attrName);
    }
    if (enabled.peek()) {
      for (const element of elements.value) {
        element.setAttribute(attrName, '');
      }
      previousElements = [...elements.value];
    } else {
      previousElements = [];
    }
  });

  return () => {
    disposeOfStylesheetEffect();
    disposeOfElementsEffect();
  };
}
