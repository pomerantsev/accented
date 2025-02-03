import { batch } from '@preact/signals-core';
import { extendedElementsWithIssues } from '../state.js';
import getElementPosition from './get-element-position.js';

let frameRequested = false;

export default function recalculatePositions() {
  if (frameRequested) {
    return;
  }
  frameRequested = true;
  window.requestAnimationFrame(() => {
    console.log('Recalculating positions');
    frameRequested = false;
    batch(() => {
      console.log('Element count:', extendedElementsWithIssues.value.length);
      extendedElementsWithIssues.value.forEach(({ element, position }) => {
        if (element.isConnected) {
          position.value = getElementPosition(element, window);
        }
      });
    });
  });
}
