import { batch } from '@preact/signals-core';
import { extendedElementsWithIssues } from '../state.js';
import getScrollableAncestors from './get-scrollable-ancestors.js';

export default function recalculateScrollableAncestors() {
  batch(() => {
    extendedElementsWithIssues.value.forEach(({ element, scrollableAncestors }) => {
      if (element.isConnected) {
        scrollableAncestors.value = getScrollableAncestors(element, window);
      }
    });
  });
}
