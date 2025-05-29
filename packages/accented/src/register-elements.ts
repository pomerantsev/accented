import getAccentedDialog from './elements/accented-dialog.js';
import getAccentedTrigger from './elements/accented-trigger.js';

export default function registerElements(name: string): void {
  const elements = [
    {
      elementName: `${name}-trigger`,
      Component: getAccentedTrigger(name)
    },
    {
      elementName: `${name}-dialog`,
      Component: getAccentedDialog()
    }
  ];

  for (const { elementName, Component } of elements) {
    if (!customElements.get(elementName)) {
      customElements.define(elementName, Component);
    }
  }
};
