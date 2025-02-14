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
      if (elementWithIssues.trigger.dialog) {
        document.body.append(elementWithIssues.trigger.dialog);
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
      if (elementWithIssues.trigger.dialog) {
        elementWithIssues.trigger.dialog.remove();
      }
      if (intersectionObserver) {
        intersectionObserver.unobserve(elementWithIssues.element);
      }
    }
  }

  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`
    @layer ${name} {
      :root {
        --${name}-primary-color: red;
        --${name}-light-color: white;
        --${name}-dark-color: black;
        --${name}-outline-width: 2px;
        --${name}-outline-style: solid;

        /* @link https://utopia.fyi/type/calculator?c=320,16,1.2,1240,18,1.25,5,2,&s=0.75|0.5|0.25,1.5|2|3|4|6,s-l&g=s,l,xl,12 */
        --${name}-step--2: clamp(0.6944rem, 0.6856rem + 0.0444vw, 0.72rem);
        --${name}-step--1: clamp(0.8333rem, 0.8101rem + 0.1159vw, 0.9rem);
        --${name}-step-0: clamp(1rem, 0.9565rem + 0.2174vw, 1.125rem);
        --${name}-step-1: clamp(1.2rem, 1.1283rem + 0.3587vw, 1.4063rem);
        --${name}-step-2: clamp(1.44rem, 1.3295rem + 0.5527vw, 1.7578rem);
        --${name}-step-3: clamp(1.728rem, 1.5648rem + 0.8161vw, 2.1973rem);
        --${name}-step-4: clamp(2.0736rem, 1.8395rem + 1.1704vw, 2.7466rem);
        --${name}-step-5: clamp(2.4883rem, 2.1597rem + 1.6433vw, 3.4332rem);

        /* @link https://utopia.fyi/space/calculator?c=320,16,1.2,1240,18,1.25,5,2,&s=0.75|0.5|0.25,1.5|2|3|4|6,s-l&g=s,l,xl,12 */
        --${name}-space-3xs: clamp(0.25rem, 0.2283rem + 0.1087vw, 0.3125rem);
        --${name}-space-2xs: clamp(0.5rem, 0.4783rem + 0.1087vw, 0.5625rem);
        --${name}-space-xs: clamp(0.75rem, 0.7065rem + 0.2174vw, 0.875rem);
        --${name}-space-s: clamp(1rem, 0.9565rem + 0.2174vw, 1.125rem);
        --${name}-space-m: clamp(1.5rem, 1.4348rem + 0.3261vw, 1.6875rem);
        --${name}-space-l: clamp(2rem, 1.913rem + 0.4348vw, 2.25rem);
        --${name}-space-xl: clamp(3rem, 2.8696rem + 0.6522vw, 3.375rem);
        --${name}-space-2xl: clamp(4rem, 3.8261rem + 0.8696vw, 4.5rem);
        --${name}-space-3xl: clamp(6rem, 5.7391rem + 1.3043vw, 6.75rem);
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
