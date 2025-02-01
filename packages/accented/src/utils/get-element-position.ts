import type { Position } from '../types';

// TODO: test?
export default function getElementPosition(element: Element, win: Window): Position {
  const rect = element.getBoundingClientRect();
  const direction = win.getComputedStyle(element).direction;
  if (direction === 'ltr') {
    return {
      inlineEndLeft: rect.right,
      blockStartTop: rect.top,
      direction
    };
  } else if (direction === 'rtl') {
    return {
      inlineEndLeft: rect.left,
      blockStartTop: rect.top,
      direction
    };
  } else {
    throw new Error(`The element ${element} has a direction "${direction}", which is not supported.`);
  }
}
