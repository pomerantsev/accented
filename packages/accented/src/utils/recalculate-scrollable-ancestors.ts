import { batch } from '@preact/signals-core';
import { extendedElementsWithIssues } from '../state.js';
import { getScrollableAncestors } from './get-scrollable-ancestors.js';

export function recalculateScrollableAncestors() {
  batch(() => {
    for (const { element, scrollableAncestors } of extendedElementsWithIssues.value) {
      if (element.isConnected) {
        scrollableAncestors.value = getScrollableAncestors(element);
      }
    }
  });
}
