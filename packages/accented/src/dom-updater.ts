import { effect } from '@preact/signals-core';
import { extendedElementsWithIssues } from './state.js';
import type { ExtendedElementWithIssues } from './types';

export default function createDomUpdater(name: string) {
  const attrName = `data-${name}`;

  function supportsAnchorPositioning () {
    return CSS.supports('anchor-name: --foo') && CSS.supports('position-anchor: --foo');
  }

  function setAnchorName (element: HTMLElement, id: number) {
    const anchorNameValue = element.style.getPropertyValue('anchor-name') || window.getComputedStyle(element).getPropertyValue('anchor-name');
    const anchorNames = anchorNameValue
      .split(/,\s*/)
      .filter(anchorName => anchorName.startsWith('--'));
    if (anchorNames.length > 0) {
      element.style.setProperty('anchor-name', `${anchorNameValue}, --${name}-anchor-${id}`);
    } else {
      element.style.setProperty('anchor-name', `--${name}-anchor-${id}`);
    }
  }

  function removeAnchorName (element: HTMLElement, id: number) {
    const anchorNameValue = element.style.getPropertyValue('anchor-name');
    const anchorNames = anchorNameValue
      .split(/,\s*/)
      .filter(anchorName => anchorName.startsWith('--'));
    const index = anchorNames.indexOf(`--${name}-anchor-${id}`);
    if (anchorNames.length === 1 && index === 0) {
      element.style.removeProperty('anchor-name');
    } else if (anchorNames.length > 1 && index > -1) {
      element.style.setProperty('anchor-name', anchorNames.filter((_, i) => i !== index).join(', '));
    }
  }

  function setIssues (extendedElementsWithIssues: Array<ExtendedElementWithIssues>) {
    const displayAccentedContainers = supportsAnchorPositioning();
    for (const elementWithIssues of extendedElementsWithIssues) {
      elementWithIssues.element.setAttribute(attrName, '');
      if (displayAccentedContainers) {
        setAnchorName(elementWithIssues.element, elementWithIssues.id);
        if (elementWithIssues.element.parentElement) {
          elementWithIssues.element.insertAdjacentElement('afterend', elementWithIssues.accentedContainer);
        } else {
          elementWithIssues.element.insertAdjacentElement('beforeend', elementWithIssues.accentedContainer);
        }
      }
    }
  }

  function removeIssues (extendedElementsWithIssues: Array<ExtendedElementWithIssues>) {
    for (const elementWithIssues of extendedElementsWithIssues) {
      elementWithIssues.element.removeAttribute(attrName);
      removeAnchorName(elementWithIssues.element, elementWithIssues.id);
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
