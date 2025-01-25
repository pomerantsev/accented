import getAccentedContainer from './elements/accented-container.js';
import getAccentedDialog from './elements/accented-dialog.js';

export default function registerElements(name: string): void {
  const elements = [
    {
      elementName: `${name}-container`,
      Component: getAccentedContainer(name)
    },
    {
      elementName: `${name}-dialog`,
      Component: getAccentedDialog(name)
    }
  ];

  for (const { elementName, Component } of elements) {
    if (!customElements.get(elementName)) {
      customElements.define(elementName, Component);
    }
  }
};
