import { effect } from '@preact/signals-core';
import { logAndRethrow } from './log-and-rethrow.js';
import { scrollableAncestors } from './state.js';
import { recalculatePositions } from './utils/recalculate-positions.js';

export function setupScrollListeners() {
  const documentAbortController = new AbortController();
  document.addEventListener(
    'scroll',
    () => {
      try {
        recalculatePositions();
      } catch (error) {
        logAndRethrow(error);
      }
    },
    { signal: documentAbortController.signal },
  );

  const disposeOfEffect = effect(() => {
    // TODO: optimize performance, issue #81
    const elementAbortController = new AbortController();
    for (const scrollableAncestor of scrollableAncestors.value) {
      scrollableAncestor.addEventListener(
        'scroll',
        () => {
          try {
            recalculatePositions();
          } catch (error) {
            logAndRethrow(error);
          }
        },
        { signal: elementAbortController.signal },
      );
    }
    return () => {
      elementAbortController.abort();
    };
  });

  return () => {
    documentAbortController.abort();
    disposeOfEffect();
  };
}
