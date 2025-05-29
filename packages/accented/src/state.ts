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

export const rootNodes = computed<Set<Node>>(
  () =>
    new Set(
      (enabled.value ? [document as Node] : []).concat(
        ...extendedElementsWithIssues.value.map(
          (extendedElementWithIssues) => extendedElementWithIssues.rootNode,
        ),
      ),
    ),
);

export const scrollableAncestors = computed<Set<Element>>(() =>
  extendedElementsWithIssues.value.reduce((scrollableAncestors, extendedElementWithIssues) => {
    for (const scrollableAncestor of extendedElementWithIssues.scrollableAncestors.value) {
      scrollableAncestors.add(scrollableAncestor);
    }
    return scrollableAncestors;
  }, new Set<Element>()),
);
