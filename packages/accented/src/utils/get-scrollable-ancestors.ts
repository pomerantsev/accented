const scrollableOverflowValues = new Set(['auto', 'scroll', 'hidden']);

export default function getScrollableAncestors (element: HTMLElement, win: Window) {
  let currentElement = element;
  let scrollableAncestors = new Set<HTMLElement>();
  while (currentElement.parentElement) {
    currentElement = currentElement.parentElement;
    const computedStyle = win.getComputedStyle(currentElement);
    if (scrollableOverflowValues.has(computedStyle.overflowX) || scrollableOverflowValues.has(computedStyle.overflowY)) {
      scrollableAncestors.add(currentElement);
    }
  }
  return scrollableAncestors;
};
