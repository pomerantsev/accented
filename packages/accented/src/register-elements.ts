import getAccentedContainer from './elements/accented-container.js';

export default function registerElements(name: string): void {
  const elements = [
    {
      elementName: `${name}-container`,
      Component: getAccentedContainer(name)
    }
  ];

  for (const { elementName, Component } of elements) {
    if (!customElements.get(elementName)) {
      customElements.define(elementName, Component);
    }
  }
};
