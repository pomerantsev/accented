import axe from 'axe-core';
import TaskQueue from './task-queue.js';
import { elementsWithIssues, enabled, extendedElementsWithIssues } from './state.js';
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

    updateElementsWithIssues(extendedElementsWithIssues, result.violations, window, name);

    callback({
      elementsWithIssues: elementsWithIssues.value,
      scanDuration: Math.round(axeMeasure.duration)
    });
  }, throttle);

  taskQueue.add(document);

  const mutationObserver = new MutationObserver(mutationList => {
    const listWithoutAccentedElements = mutationList.filter(mutationRecord => {
      return !(mutationRecord.type === 'childList' &&
        [...mutationRecord.addedNodes].every(node => [`${name}-trigger`, `${name}-dialog`].includes(node.nodeName.toLowerCase())) &&
        [...mutationRecord.removedNodes].every(node => [`${name}-trigger`, `${name}-dialog`].includes(node.nodeName.toLowerCase())));
    });

    const elementsWithAccentedAttributeChanges = listWithoutAccentedElements.reduce((nodes, mutationRecord) => {
      if (mutationRecord.type === 'attributes' && mutationRecord.attributeName === `data-${name}`) {
        nodes.add(mutationRecord.target);
      }
      return nodes;
    }, new Set<Node>());

    const filteredMutationList = listWithoutAccentedElements.filter(mutationRecord => {
      return !elementsWithAccentedAttributeChanges.has(mutationRecord.target);
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
