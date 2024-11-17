import axe from 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/+esm';
import TaskQueue from './task-queue.js';

const taskQueue = new TaskQueue(async () => {
  performance.mark('axe-start');

  const result = await axe.run();

  const axeMeasure = performance.measure('axe', 'axe-start');

  console.log('Result:', result);
  console.log('Axe run duration:', Math.round(axeMeasure.duration), 'ms');
});

taskQueue.add(document);

const mutationObserver = new MutationObserver(mutationList => {
  // TODO: filter out irrelevant mutations
  for (const mutationRecord of mutationList) {
    taskQueue.add(mutationRecord.target);
  }
});

// TODO: read more about the params and decide which ones we need.
mutationObserver.observe(document, {
  subtree: true,
  childList: true,
  attributes: true
});
