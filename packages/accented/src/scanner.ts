import axe from 'axe-core';
import TaskQueue from './task-queue.js';
// import transformViolations from './utils/transform-violations.js';
import { computedElementsWithIssues, enabled, extendedElementsWithIssues } from './state.js';
import type { Throttle, Callback } from './types';
import updateElementsWithIssues from './utils/update-elements-with-issues.js';

export default function createScanner(name: string, throttle: Required<Throttle>, callback: Callback) {
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

    // console.log('Before updating');
    // elementsWithIssues.value = transformViolations(result.violations);
    // console.log('After updating');

    updateElementsWithIssues(extendedElementsWithIssues, result.violations);

    callback({
      elementsWithIssues: computedElementsWithIssues.value,
      scanDuration: Math.round(axeMeasure.duration)
    });
  }, throttle);

  taskQueue.add(document);

  const mutationObserver = new MutationObserver(mutationList => {
    const filteredMutationList = mutationList.filter(mutationRecord => {
      return !(mutationRecord.type === 'attributes' && mutationRecord.attributeName === `data-${name}`);
    });
    taskQueue.addMultiple(filteredMutationList.map(mutationRecord => mutationRecord.target));
  });

  mutationObserver.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true
  });
  return () => {
    mutationObserver.disconnect();
  };
}
