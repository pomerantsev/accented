import state from './state.js';

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

  document.addEventListener('accentedUpdate', () => {
    removeIssues(previousElements);
    setIssues(state.elements);
    previousElements = [...state.elements];
  }, {signal: state.abortController.signal});
  state.abortController.signal.addEventListener('abort', () => {
    removeIssues(previousElements);
  });

  return () => {
    removeStylesheet();
  };
}
