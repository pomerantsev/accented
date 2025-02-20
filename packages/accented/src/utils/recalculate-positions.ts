import { batch } from '@preact/signals-core';
import { extendedElementsWithIssues } from '../state.js';
import getElementPosition from './get-element-position.js';
import logAndRethrow from '../log-and-rethrow.js';

let frameRequested = false;

export default function recalculatePositions() {
  if (frameRequested) {
    return;
  }
  frameRequested = true;
  window.requestAnimationFrame(() => {
    try {
      frameRequested = false;
      batch(() => {
        extendedElementsWithIssues.value.forEach(({ element, position, visible }) => {
          if (visible.value && element.isConnected) {
            position.value = getElementPosition(element, window);
          }
        });
      });
    } catch (error) {
      logAndRethrow(error);
    }
  });
}
