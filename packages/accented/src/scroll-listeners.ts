import { effect } from '@preact/signals-core';
import recalculatePositions from './utils/recalculate-positions.js';
import { scrollableAncestors } from './state.js';

export default function setupScrollListeners() {
  const documentAbortController = new AbortController();
  document.addEventListener('scroll', () => {
    recalculatePositions();
  }, { signal: documentAbortController.signal });

  const disposeOfEffect = effect(() => {
    // TODO: we're recreating all listeners every time.
    // We should probably optimize this.
    const elementAbortController = new AbortController();
    for (const scrollableAncestor of scrollableAncestors.value) {
      scrollableAncestor.addEventListener('scroll', () => {
        // TODO: we definitely don't want to recalculate positions for all elements every time.
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
