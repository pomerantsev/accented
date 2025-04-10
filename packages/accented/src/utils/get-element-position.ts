import type { Position } from '../types';
import { isHtmlElement } from './dom-helpers.js';
import getParent from './get-parent.js';

// https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block#identifying_the_containing_block
function isContainingBlock(element: Element, win: Window): boolean {
  const style = win.getComputedStyle(element);
  const { transform, perspective } = style;
  // TODO: https://github.com/pomerantsev/accented/issues/119
  // Support other types of containing blocks
  return transform !== 'none'
    || perspective !== 'none';
}

function getNonInitialContainingBlock(element: Element, win: Window): Element | null {
  let currentElement: Element | null = element;
  while (currentElement) {
    currentElement = getParent(currentElement);
    if (currentElement && isContainingBlock(currentElement, win)) {
      return currentElement;
    }
  }
  return null;
}

/**
 * https://github.com/pomerantsev/accented/issues/116
 *
 * This calculation leads to incorrectly positioned Accented triggers when all of the following are true:
 * * The element is an SVG element.
 * * The element itself, or one of the element's ancestors has a scale or rotate transform.
 * * The browser doesn't support anchor positioning.
 */
export default function getElementPosition(element: Element, win: Window): Position {
  const nonInitialContainingBlock = getNonInitialContainingBlock(element, win);
  // If an element has an ancestor whose transform is not 'none',
  // fixed positioning works differently.
  // https://achrafkassioui.com/blog/position-fixed-and-CSS-transforms/
  if (nonInitialContainingBlock) {
    if (isHtmlElement(element)) {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      let left = element.offsetLeft;
      let top = element.offsetTop;
      let currentElement = element.offsetParent as HTMLElement | null;
      // Non-initial containing block may not be an offset parent, we have to account for that as well.
      while (currentElement && currentElement !== nonInitialContainingBlock) {
        left += currentElement.offsetLeft;
        top += currentElement.offsetTop;
        currentElement = currentElement.offsetParent as HTMLElement | null;
      }
      return { top, left, width, height };
    } else {
      const elementRect = element.getBoundingClientRect();
      const nonInitialContainingBlockRect = nonInitialContainingBlock.getBoundingClientRect();
      return {
        top: elementRect.top - nonInitialContainingBlockRect.top,
        height: elementRect.height,
        left: elementRect.left - nonInitialContainingBlockRect.left,
        width: elementRect.width
      };
    }
  } else {
    return element.getBoundingClientRect();
  }
}
