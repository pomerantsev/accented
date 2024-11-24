const attrName = 'data-accented';

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

  #addStylesheetToDocument() {
    // TODO: is this the preferred way of adding a stylesheet?
    const styleElement = document.createElement('style');
    styleElement.innerText = `
      [${attrName}]:not(:focus-visible) {
        outline: 2px solid red !important;
        outline-offset: -2px;
      }
    `;
    document.head.appendChild(styleElement);
  }
}
