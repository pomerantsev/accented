import { getParent } from './get-parent.js';

const scrollableOverflowValues = new Set(['auto', 'scroll', 'hidden']);

export function getScrollableAncestors(element: Element) {
  let currentElement: Element | null = element;
  const scrollableAncestors = new Set<Element>();
  while (true) {
    currentElement = getParent(currentElement);
    if (!currentElement) {
      break;
    }
    const computedStyle = getComputedStyle(currentElement);
    if (
      scrollableOverflowValues.has(computedStyle.overflowX) ||
      scrollableOverflowValues.has(computedStyle.overflowY)
    ) {
      scrollableAncestors.add(currentElement);
    }
  }
  return scrollableAncestors;
}
