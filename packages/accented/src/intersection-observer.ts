import { logAndRethrow } from './log-and-rethrow.js';
import { extendedElementsWithIssues } from './state.js';
import { getElementPosition } from './utils/get-element-position.js';
import { supportsAnchorPositioning } from './utils/supports-anchor-positioning.js';

export function setupIntersectionObserver() {
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      try {
        for (const entry of entries) {
          const extendedElementWithIssues = extendedElementsWithIssues.value.find(
            (el) => el.element === entry.target,
          );
          if (extendedElementWithIssues) {
            // We initially treated setting visibility in the intersection observer
            // as a fallback option for browsers that don't support `position-visibility`,
            // but then we realized that this `position-visibility` actually works
            // in an unexpected way when the container has `overflow: visible`.
            // So now we always set visibility in the intersection observer.
            extendedElementWithIssues.visible.value = entry.isIntersecting;
            if (entry.isIntersecting && !supportsAnchorPositioning()) {
              extendedElementWithIssues.position.value = getElementPosition(entry.target);
            }
          }
        }
      } catch (error) {
        logAndRethrow(error);
      }
    },
    { threshold: 0 },
  );

  return {
    intersectionObserver,
    disconnect: () => {
      intersectionObserver.disconnect();
    },
  };
}
