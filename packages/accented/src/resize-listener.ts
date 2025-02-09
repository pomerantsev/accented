import recalculatePositions from './utils/recalculate-positions.js';

export default function setupResizeListener() {
  const abortController = new AbortController();
  window.addEventListener('resize', () => {
    recalculatePositions();
  }, { signal: abortController.signal });

  return () => {
    abortController.abort();
  };
};
