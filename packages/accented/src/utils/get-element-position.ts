import type { Position } from '../types';

function getNearestTransformedAncestor(element: Element, win: Window): Element | null {
  let currentElement: Element | null = element;
  while (currentElement) {
    const transform = win.getComputedStyle(currentElement).transform;
    if (transform !== 'none') {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
  }
  return null;
}

export default function getElementPosition(element: Element, win: Window): Position {
  const rect = element.getBoundingClientRect();
  const transformedAncestor = getNearestTransformedAncestor(element, win);
  let top, left, right;
  // If an element has an ancestor whose transform is not 'none',
  // fixed positioning works differently.
  // https://achrafkassioui.com/blog/position-fixed-and-CSS-transforms/
  if (transformedAncestor) {
    const transformedAncestorRect = transformedAncestor.getBoundingClientRect();
    top = rect.top - transformedAncestorRect.top;
    left = rect.left - transformedAncestorRect.left;
    right = rect.right - transformedAncestorRect.left;
  } else {
    top = rect.top;
    left = rect.left;
    right = rect.right;
  }
  const direction = win.getComputedStyle(element).direction;
  if (direction === 'ltr') {
    return {
      inlineEndLeft: right,
      blockStartTop: top,
      direction
    };
  } else if (direction === 'rtl') {
    return {
      inlineEndLeft: left,
      blockStartTop: top,
      direction
    };
  } else {
    throw new Error(`The element ${element} has a direction "${direction}", which is not supported.`);
  }
}
