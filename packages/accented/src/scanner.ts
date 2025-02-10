import axe from 'axe-core';
import TaskQueue from './task-queue.js';
import { elementsWithIssues, enabled, extendedElementsWithIssues } from './state.js';
import type { Throttle, Callback } from './types';
import updateElementsWithIssues from './utils/update-elements-with-issues.js';
import recalculatePositions from './utils/recalculate-positions.js';
import recalculateScrollableAncestors from './utils/recalculate-scrollable-ancestors.js';
import supportsAnchorPositioning from './utils/supports-anchor-positioning.js';

export default function createScanner(name: string, throttle: Required<Throttle>, callback: Callback) {
  const axeRunningWindowProp = `__${name}_axe_running__`;
  const win: Record<string, any> = window;
  const taskQueue = new TaskQueue<Node>(async () => {
    // We may see errors coming from axe-core when Accented is toggled off and on in qiuck succession,
    // which I've seen happen with hot reloading of a React application.
    // This window property serves as a circuit breaker for that particular case.
    if (win[axeRunningWindowProp]) {
      return;
    }

    performance.mark('axe-start');

    win[axeRunningWindowProp] = true;
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
    win[axeRunningWindowProp] = false;

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

  const accentedElementNames = [`${name}-trigger`, `${name}-dialog`];
  const mutationObserver = new MutationObserver(mutationList => {

    // We're not interested in mutations that are caused exclusively by the custom elements
    // introduced by Accented.
    const listWithoutAccentedElements = mutationList.filter(mutationRecord => {
      const onlyAccentedElementsAddedOrRemoved = mutationRecord.type === 'childList' &&
        [...mutationRecord.addedNodes].every(node => accentedElementNames.includes(node.nodeName.toLowerCase())) &&
        [...mutationRecord.removedNodes].every(node => accentedElementNames.includes(node.nodeName.toLowerCase()));
      const accentedElementChanged = mutationRecord.type === 'attributes' &&
        accentedElementNames.includes(mutationRecord.target.nodeName.toLowerCase());
      return !(onlyAccentedElementsAddedOrRemoved || accentedElementChanged);
    });

    if (listWithoutAccentedElements.length !== 0 && !supportsAnchorPositioning(window)) {
      // Something has changed in the DOM, so we need to realign all triggers with respective elements.
      recalculatePositions();

      // Elements' scrollable ancestors only change when styles change
      // (specifically when the `display` prop on one of the ancestors changes),
      // so a good place to recalculate the scrollable ancestors for elements is here.
      // In future, we could further optimize this by only recalculating scrollable ancestors for elements that have changed.
      recalculateScrollableAncestors();
    }

    // Exclude all mutations on elements that got the accented attribute added or removed.
    // If we simply exclude all mutations where attributeName = `data-${name}`,
    // we may miss other mutations on those same elements caused by Accented,
    // leading to extra runs of the mutation observer.
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
