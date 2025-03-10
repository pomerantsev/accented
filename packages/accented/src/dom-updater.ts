import { effect } from '@preact/signals-core';
import { extendedElementsWithIssues } from './state.js';
import type { ExtendedElementWithIssues } from './types';
import supportsAnchorPositioning from './utils/supports-anchor-positioning.js';

export default function createDomUpdater(name: string, intersectionObserver?: IntersectionObserver) {
  const attrName = `data-${name}`;

  function getAnchorNames (anchorNameValue: string) {
    return anchorNameValue
      .split(',')
      .map(anchorName => anchorName.trim())
      .filter(anchorName => anchorName.startsWith('--'));
  }

  function setAnchorName (element: HTMLElement, id: number) {
    const anchorNameValue = element.style.getPropertyValue('anchor-name') || window.getComputedStyle(element).getPropertyValue('anchor-name');
    const anchorNames = getAnchorNames(anchorNameValue);
    if (anchorNames.length > 0) {
      element.style.setProperty('anchor-name', `${anchorNameValue}, --${name}-anchor-${id}`);
    } else {
      element.style.setProperty('anchor-name', `--${name}-anchor-${id}`);
    }
  }

  function removeAnchorName (element: HTMLElement, id: number) {
    const anchorNameValue = element.style.getPropertyValue('anchor-name');
    const anchorNames = getAnchorNames(anchorNameValue);
    const index = anchorNames.indexOf(`--${name}-anchor-${id}`);
    if (anchorNames.length === 1 && index === 0) {
      element.style.removeProperty('anchor-name');
    } else if (anchorNames.length > 1 && index > -1) {
      element.style.setProperty('anchor-name', anchorNames.filter((_, i) => i !== index).join(', '));
    }
  }

  function setIssues (extendedElementsWithIssues: Array<ExtendedElementWithIssues>) {
    for (const elementWithIssues of extendedElementsWithIssues) {
      elementWithIssues.element.setAttribute(attrName, elementWithIssues.id.toString());
      if (supportsAnchorPositioning(window)) {
        setAnchorName(elementWithIssues.element, elementWithIssues.id);
      }

      if (elementWithIssues.element.parentElement) {
        elementWithIssues.element.insertAdjacentElement('afterend', elementWithIssues.trigger);
      } else {
        elementWithIssues.element.insertAdjacentElement('beforeend', elementWithIssues.trigger);
      }
      if (intersectionObserver) {
        intersectionObserver.observe(elementWithIssues.element);
      }
    }
  }

  function removeIssues (extendedElementsWithIssues: Array<ExtendedElementWithIssues>) {
    for (const elementWithIssues of extendedElementsWithIssues) {
      elementWithIssues.element.removeAttribute(attrName);
      if (supportsAnchorPositioning(window)) {
        removeAnchorName(elementWithIssues.element, elementWithIssues.id);
      }
      elementWithIssues.trigger.remove();
      if (intersectionObserver) {
        intersectionObserver.unobserve(elementWithIssues.element);
      }
    }
  }

  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`
    @layer ${name} {
      :root {
        /* Ensure that the primary / secondary color combination meets WCAG 1.4.3 Contrast (Minimum) */
        --${name}-primary-color: #d73a4a;
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
