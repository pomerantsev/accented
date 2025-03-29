import { effect } from '@preact/signals-core';
import { extendedElementsWithIssues, rootNodes } from './state.js';
import type { ExtendedElementWithIssues } from './types';
import areElementsWithIssuesEqual from './utils/are-elements-with-issues-equal.js';
import supportsAnchorPositioning from './utils/supports-anchor-positioning.js';
import { isDocument, isDocumentFragment, isShadowRoot } from './utils/dom-helpers.js';
import getParent from './utils/get-parent.js';

export default function createDomUpdater(name: string, intersectionObserver?: IntersectionObserver) {
  const attrName = `data-${name}`;

  function getAnchorNames (anchorNameValue: string) {
    return anchorNameValue
      .split(',')
      .map(anchorName => anchorName.trim())
      .filter(anchorName => anchorName.startsWith('--'));
  }

  function setAnchorName (elementWithIssues: ExtendedElementWithIssues) {
    const { element, id, anchorNameValue } = elementWithIssues;
    const anchorNames = getAnchorNames(anchorNameValue);
    if (anchorNames.length > 0) {
      element.style.setProperty('anchor-name', `${anchorNameValue}, --${name}-anchor-${id}`);
    } else {
      element.style.setProperty('anchor-name', `--${name}-anchor-${id}`);
    }
  }

  function removeAnchorName (elementWithIssues: ExtendedElementWithIssues) {
    const { element, anchorNameValue } = elementWithIssues;
    const anchorNames = getAnchorNames(anchorNameValue);
    if (anchorNames.length > 0) {
      element.style.setProperty('anchor-name', anchorNames.join(', '));
    } else {
      element.style.removeProperty('anchor-name');
    }
  }

  function setIssues (extendedElementsWithIssues: Array<ExtendedElementWithIssues>) {
    for (const elementWithIssues of extendedElementsWithIssues) {
      elementWithIssues.element.setAttribute(attrName, elementWithIssues.id.toString());
      if (supportsAnchorPositioning(window)) {
        setAnchorName(elementWithIssues);
      }

      if (getParent(elementWithIssues.element)) {
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
        removeAnchorName(elementWithIssues);
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
        /* OKLCH stuff: https://oklch.com/ */
        --${name}-primary-color: oklch(0.5 0.3 0);
        --${name}-secondary-color: oklch(0.98 0 0);
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

  let previousRootNodes: Set<Node> = new Set();

  const disposeOfStyleSheetsEffect = effect(() => {
    const newRootNodes = rootNodes.value;
    const addedRootNodes = [...newRootNodes].filter(rootNode => !previousRootNodes.has(rootNode));
    const removedRootNodes = [...previousRootNodes].filter(rootNode => !newRootNodes.has(rootNode));
    for (const rootNode of addedRootNodes) {
      if (isDocument(rootNode) || (isDocumentFragment(rootNode) && isShadowRoot(rootNode))) {
        rootNode.adoptedStyleSheets.push(stylesheet);
      }
    }
    for (const rootNode of removedRootNodes) {
      if (isDocument(rootNode) || (isDocumentFragment(rootNode) && isShadowRoot(rootNode))) {
        rootNode.adoptedStyleSheets.splice(rootNode.adoptedStyleSheets.indexOf(stylesheet), 1);
      }
    }
    previousRootNodes = newRootNodes;
  });

  const disposeOfElementsEffect = effect(() => {
    const added = extendedElementsWithIssues.value.filter(elementWithIssues => {
      return !previousExtendedElementsWithIssues.some(previousElementWithIssues => areElementsWithIssuesEqual(previousElementWithIssues, elementWithIssues));
    });
    const removed = previousExtendedElementsWithIssues.filter(previousElementWithIssues => {
      return !extendedElementsWithIssues.value.some(elementWithIssues => areElementsWithIssuesEqual(elementWithIssues, previousElementWithIssues));
    });
    removeIssues(removed);
    setIssues(added);
    previousExtendedElementsWithIssues = [...extendedElementsWithIssues.value];
  });

  return () => {
    disposeOfStyleSheetsEffect();
    disposeOfElementsEffect();
  };
}
