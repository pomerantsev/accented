import { computed, signal } from '@preact/signals-core';

import type { ElementWithIssues, ExtendedElementWithIssues } from './types.ts';

export const enabled = signal(false);

export const extendedElementsWithIssues = signal<Array<ExtendedElementWithIssues>>([]);

export const elementsWithIssues = computed<Array<ElementWithIssues>>(() =>
  extendedElementsWithIssues.value.map((extendedElementWithIssues) => ({
    element: extendedElementWithIssues.element,
    rootNode: extendedElementWithIssues.rootNode,
    issues: extendedElementWithIssues.issues.value,
  })),
);

export const rootNodes = computed(
  () =>
    new Set(
      Array.from<Node>(enabled.value ? [document] : []).concat(
        ...extendedElementsWithIssues.value.map(
          (extendedElementWithIssues) => extendedElementWithIssues.rootNode,
        ),
      ),
    ),
);

export const scrollableAncestors = computed<Set<Element>>(() =>
  extendedElementsWithIssues.value.reduce((acc, extendedElementWithIssues) => {
    for (const scrollableAncestor of extendedElementWithIssues.scrollableAncestors.value) {
      acc.add(scrollableAncestor);
    }
    return acc;
  }, new Set<Element>()),
);
