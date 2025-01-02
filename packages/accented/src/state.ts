import { signal } from '@preact/signals-core';

import type { ElementWithIssues } from './types';

export const enabled = signal(false);

export const elementsWithIssues = signal<Array<ElementWithIssues>>([]);
