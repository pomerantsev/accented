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
    // const transformedAncestorRect = transformedAncestor.getBoundingClientRect();
    // console.log(rect.top, transformedAncestorRect.top);
    if (element instanceof HTMLElement) {
      return {
        top: element.offsetTop,
        height: element.offsetHeight,
        left: element.offsetLeft,
        width: element.offsetWidth
      };
    } else {
      throw new Error('SVG or MathML elements are not yet supported.');
    }
  } else {
    return element.getBoundingClientRect();
    // return {
    //   top: rect.top,
    //   height: rect.height,
    //   left: rect.left,
    //   width: rect.width
    // };
  }
  // const direction = win.getComputedStyle(element).direction;
  // if (direction === 'ltr') {
  //   return {
  //     inlineEndLeft: right,
  //     blockStartTop: top,
  //     direction
  //   };
  // } else if (direction === 'rtl') {
  //   return {
  //     inlineEndLeft: left,
  //     blockStartTop: top,
  //     direction
  //   };
  // } else {
  //   throw new Error(`The element ${element} has a direction "${direction}", which is not supported.`);
  // }
}
