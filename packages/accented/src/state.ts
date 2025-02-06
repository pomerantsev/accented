import { signal, computed } from '@preact/signals-core';

import type { ElementWithIssues, ExtendedElementWithIssues } from './types';

export const enabled = signal(false);

export const extendedElementsWithIssues = signal<Array<ExtendedElementWithIssues>>([]);

export const elementsWithIssues = computed<Array<ElementWithIssues>>(() => extendedElementsWithIssues.value.map(extendedElementWithIssues => ({
  element: extendedElementWithIssues.element,
  issues: extendedElementWithIssues.issues.value
})));

export const scrollableAncestors = computed<Set<HTMLElement>>(() =>
  extendedElementsWithIssues.value.reduce(
    (scrollableAncestors, extendedElementWithIssues) => {
      for (const scrollableAncestor of extendedElementWithIssues.scrollableAncestors.value) {
        scrollableAncestors.add(scrollableAncestor);
      }
      return scrollableAncestors;
    },
    new Set<HTMLElement>()
  )
);
