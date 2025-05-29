import getParent from './get-parent.js';

const scrollableOverflowValues = new Set(['auto', 'scroll', 'hidden']);

export default function getScrollableAncestors(element: Element, win: Window) {
  let currentElement: Element | null = element;
  const scrollableAncestors = new Set<Element>();
  while (true) {
    currentElement = getParent(currentElement);
    if (!currentElement) {
      break;
    }
    const computedStyle = win.getComputedStyle(currentElement);
    if (
      scrollableOverflowValues.has(computedStyle.overflowX) ||
      scrollableOverflowValues.has(computedStyle.overflowY)
    ) {
      scrollableAncestors.add(currentElement);
    }
  }
  return scrollableAncestors;
}
