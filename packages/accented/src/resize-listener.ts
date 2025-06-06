import { logAndRethrow } from './log-and-rethrow.js';
import { recalculatePositions } from './utils/recalculate-positions.js';

export function setupResizeListener() {
  const abortController = new AbortController();
  window.addEventListener(
    'resize',
    () => {
      try {
        recalculatePositions();
      } catch (error) {
        logAndRethrow(error);
      }
    },
    { signal: abortController.signal },
  );

  return () => {
    abortController.abort();
  };
}
