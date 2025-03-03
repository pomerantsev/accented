import type { Position } from '../types';
import isHtmlElement from './is-html-element.js';

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
  while (currentElement?.parentElement) {
    currentElement = currentElement.parentElement;
    if (isContainingBlock(currentElement, win)) {
      return currentElement;
    }
  }
  return null;
}

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
      // TODO: https://github.com/pomerantsev/accented/issues/116
      // This is half-baked. It works incorrectly with scaled / rotated elements with issues.
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
