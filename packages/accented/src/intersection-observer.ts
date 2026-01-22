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
            /* We initially treated setting visibility in the intersection observer
               as a fallback option for browsers that don't support `position-visibility`,
               but then we realized that this `position-visibility` actually works
               in an unexpected way when the container has `overflow: visible`.
               So now we always set visibility in the intersection observer.

               Update (Jan 2026): the original Chromium issue is fixed:
               https://issues.chromium.org/issues/425901169

               However, there's another issue that makes me hesitant to use `position-visibility`.
               According to the spec (https://www.w3.org/TR/css-anchor-position-1/#position-visibility),
               when the element is hidden with `position-visibility`, its `visibility` property computes
               to `force-hidden`. That, however, is not implemented in any of the browsers
               at the time of this writing (the computed value of `visibility` is still `visible`),
               which seems to be the reason why Playwright is still reporting those elements as visible
               (and it doesn't seem possible to automatically determine if they're visible or not).

               Until that's properly implemented, we're probably better off relying on an intersection observer
               (and having the visibility state testable).
            */

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
