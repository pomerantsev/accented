import { effect } from '@preact/signals-core';
import recalculatePositions from './utils/recalculate-positions.js';
import { scrollableAncestors } from './state.js';

export default function setupScrollListeners() {
  const documentAbortController = new AbortController();
  document.addEventListener('scroll', () => {
    recalculatePositions();
  }, { signal: documentAbortController.signal });

  const disposeOfEffect = effect(() => {
    // TODO: issue #81
    const elementAbortController = new AbortController();
    for (const scrollableAncestor of scrollableAncestors.value) {
      scrollableAncestor.addEventListener('scroll', () => {
        recalculatePositions();
      }, { signal: elementAbortController.signal });
    }
    return () => {
      elementAbortController.abort();
    }
  });

  return () => {
    documentAbortController.abort();
    disposeOfEffect();
  };
};
