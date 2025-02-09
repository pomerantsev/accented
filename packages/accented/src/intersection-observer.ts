import { extendedElementsWithIssues } from './state.js';
import getElementPosition from './utils/get-element-position.js';

export default function setupIntersectionObserver() {
  const intersectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const extendedElementWithIssues = extendedElementsWithIssues.value.find(el => el.element === entry.target);
      if (extendedElementWithIssues) {
        extendedElementWithIssues.visible.value = entry.isIntersecting;
        if (entry.isIntersecting) {
          extendedElementWithIssues.position.value = getElementPosition(entry.target, window);
        }
      }
    }
  }, { threshold: 0 });

  return {
    intersectionObserver,
    disconnect: () => {
      intersectionObserver.disconnect();
    }
  };
}
