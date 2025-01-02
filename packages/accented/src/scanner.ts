import axe from 'axe-core';
import TaskQueue from './task-queue.js';
import transformViolations from './utils/transform-violations.js';
import { enabled, elementsWithIssues } from './state.js';

export default function createScanner(initialDelay: number, throttleDelay: number) {
  const taskQueue = new TaskQueue<Node>(async () => {
    performance.mark('axe-start');

    const result = await axe.run({
      elementRef: true,
      // Although axe-core can perform iframe scanning, I haven't succeeded in it,
      // and the docs suggest that the axe-core script should be explicitly included
      // in each of the iframed documents anyway.
      // It seems preferable to disallow iframe scanning and not report issues in elements within iframes
      // in the case that such issues are for some reason reported by axe-core.
      // A consumer of Accented can instead scan the iframed document by calling Accented initialization from that document.
      iframes: false
    });

    const axeMeasure = performance.measure('axe', 'axe-start');

    if (!enabled.value) {
      return;
    }

    elementsWithIssues.value = transformViolations(result.violations);

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
