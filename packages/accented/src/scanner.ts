import axe from 'axe-core';
import TaskQueue from './task-queue.js';
import issuesToElements from './utils/issuesToElements.js';
import state from './state.js';

export default function createScanner(initialDelay: number, throttleDelay: number) {
  const taskQueue = new TaskQueue<Node>(async () => {
    performance.mark('axe-start');

    const result = await axe.run();

    const axeMeasure = performance.measure('axe', 'axe-start');

    if (!state.enabled) {
      return;
    }

    state.elements = issuesToElements(result.violations);
    document.dispatchEvent(new Event('accentedUpdate'));

    console.log('Axe run duration:', Math.round(axeMeasure.duration), 'ms');
  }, { initialDelay, throttleDelay });

  taskQueue.add(document);

  const mutationObserver = new MutationObserver(mutationList => {
    // TODO: filter out irrelevant mutations
    for (const mutationRecord of mutationList) {
      if (mutationRecord.type === 'attributes' && mutationRecord.attributeName === 'data-accented') {
        continue;
      }
      taskQueue.add(mutationRecord.target);
    }
  });

  // TODO: read more about the params and decide which ones we need.
  mutationObserver.observe(document, {
    subtree: true,
    childList: true,
    attributes: true
  });
  return () => {
    mutationObserver.disconnect();
  };
}
