const attrName = 'data-accented';

const stylesheet = new CSSStyleSheet();
await stylesheet.replace(`
  [${attrName}]:not(:focus-visible) {
    outline: 2px solid red !important;
    outline-offset: -2px;
  }
`);

// TODO: make this work with Shadow DOM and iframes
export default class DomUpdater {
  elements: Array<Element> = [];

  constructor() {
    this.#addStylesheetToDocument();
  }

  update(newElements: Array<Element>) {
    for (const element of this.elements) {
      element.removeAttribute(attrName);
    }
    this.elements = [...newElements];
    for (const element of this.elements) {
      element.setAttribute(attrName, '');
    }
  }

  async #addStylesheetToDocument() {
    document.adoptedStyleSheets.push(stylesheet);
  }
}
