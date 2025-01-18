import { signal, computed } from '@preact/signals-core';

import type { ElementWithIssues, ExtendedElementWithIssues } from './types';

export const enabled = signal(false);

export const extendedElementsWithIssues = signal<Array<ExtendedElementWithIssues>>([]);

export const elementsWithIssues = computed<Array<ElementWithIssues>>(() => extendedElementsWithIssues.value.map(extendedElementWithIssues => ({
  element: extendedElementWithIssues.element,
  issues: extendedElementWithIssues.issues.value
})));
