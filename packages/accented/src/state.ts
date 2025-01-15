import { signal, computed } from '@preact/signals-core';

import type { ExtendedElementWithIssues, ElementWithIssues } from './types';

export const enabled = signal(false);

// export const elementsWithIssues = signal<Array<ElementWithIssues>>([]);

export const extendedElementsWithIssues = signal<Array<ExtendedElementWithIssues>>([]);

export const computedElementsWithIssues = computed(() => extendedElementsWithIssues.value.map(extendedElementWithIssues => ({
  element: extendedElementWithIssues.element,
  issues: extendedElementWithIssues.issues.value
})));
