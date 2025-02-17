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
        /* Documented custom prop API */
        --${name}-primary-color: red;
        --${name}-secondary-color: white;
        --${name}-outline-width: 2px;
        --${name}-outline-style: solid;
        /* End of documented custom prop API */



        /* Other colors */

        --${name}-light-color: white;
        --${name}-dark-color: black;

        /* Spacing and typography custom props, inspired by https://utopia.fyi (simplified). */

        /* @link https://utopia.fyi/type/calculator?c=320,16,1.2,1240,16,1.2,5,2,&s=0.75|0.5|0.25,1.5|2|3|4|6,s-l&g=s,l,xl,12 */
        --${name}-ratio: 1.2;
        --${name}-step-0: 1rem;
        --${name}-step-1: calc(var(--${name}-step-0) * var(--${name}-ratio));
        --${name}-step-2: calc(var(--${name}-step-1) * var(--${name}-ratio));
        --${name}-step-3: calc(var(--${name}-step-2) * var(--${name}-ratio));
        --${name}-step--1: calc(var(--${name}-step-0) / var(--${name}-ratio));

        /* @link https://utopia.fyi/space/calculator?c=320,16,1.2,1240,16,1.2,5,2,&s=0.75|0.5|0.25,1.5|2|3|4|6,s-l&g=s,l,xl,12 */
        --${name}-space-3xs: 0.25rem;
        --${name}-space-2xs: 0.5rem;
        --${name}-space-xs: 0.75rem;
        --${name}-space-s: 1rem;
        --${name}-space-m: 1.5rem;
        --${name}-space-l: 2rem;
        --${name}-space-xl: 3rem;
        --${name}-space-2xl: 4rem;
        --${name}-space-3xl: 6rem;
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
