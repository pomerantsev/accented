import { batch } from '@preact/signals-core';
import { logAndRethrow } from '../log-and-rethrow.js';
import { extendedElementsWithIssues } from '../state.js';
import { getElementPosition } from './get-element-position.js';

let frameRequested = false;

export function recalculatePositions() {
  if (frameRequested) {
    return;
  }
  frameRequested = true;
  window.requestAnimationFrame(() => {
    try {
      frameRequested = false;
      batch(() => {
        for (const { element, position, visible } of extendedElementsWithIssues.value) {
          if (visible.value && element.isConnected) {
            position.value = getElementPosition(element);
          }
        }
      });
    } catch (error) {
      logAndRethrow(error);
    }
  });
}
