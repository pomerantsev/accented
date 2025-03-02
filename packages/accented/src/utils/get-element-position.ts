import type { Position } from '../types';
import isHtmlElement from './is-html-element.js';

function getNearestTransformedAncestor(element: Element, win: Window): Element | null {
  let currentElement: Element | null = element;
  while (currentElement?.parentElement) {
    currentElement = currentElement.parentElement;
    const transform = win.getComputedStyle(currentElement).transform;
    if (transform !== 'none') {
      return currentElement;
    }
  }
  return null;
}

export default function getElementPosition(element: Element, win: Window): Position {
  const transformedAncestor = getNearestTransformedAncestor(element, win);
  // If an element has an ancestor whose transform is not 'none',
  // fixed positioning works differently.
  // https://achrafkassioui.com/blog/position-fixed-and-CSS-transforms/
  if (transformedAncestor) {
    if (isHtmlElement(element)) {
      return {
        top: element.offsetTop,
        height: element.offsetHeight,
        left: element.offsetLeft,
        width: element.offsetWidth
      };
    } else {
      // TODO: https://github.com/pomerantsev/accented/issues/116
      // This is half-baked. It works incorrectly with scaled / rotated elements with issues.
      const elementRect = element.getBoundingClientRect();
      const transformedAncestorRect = transformedAncestor.getBoundingClientRect();
      return {
        top: elementRect.top - transformedAncestorRect.top,
        height: elementRect.height,
        left: elementRect.left - transformedAncestorRect.left,
        width: elementRect.width
      };
    }
  } else {
    return element.getBoundingClientRect();
  }
}
