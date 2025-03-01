import type { Position } from '../types';

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
    // TODO: can we call instanceof?
    if (element instanceof HTMLElement) {
      return {
        top: element.offsetTop,
        height: element.offsetHeight,
        left: element.offsetLeft,
        width: element.offsetWidth
      };
    } else {
      // TODO: can we do something about this now?
      throw new Error('SVG or MathML elements are not yet supported.');
    }
  } else {
    return element.getBoundingClientRect();
  }
}
