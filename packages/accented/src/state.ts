import { signal } from '@preact/signals-core';

export const enabled = signal(false);

export const elements = signal<Array<Element>>([]);
