import axe from 'axe-core';
import TaskQueue from './task-queue.js';
import { elementsWithIssues, enabled, extendedElementsWithIssues } from './state.js';
import type { AxeOptions, Throttle, Callback, AxeContext } from './types';
import updateElementsWithIssues from './utils/update-elements-with-issues.js';
import recalculatePositions from './utils/recalculate-positions.js';
import recalculateScrollableAncestors from './utils/recalculate-scrollable-ancestors.js';
import supportsAnchorPositioning from './utils/supports-anchor-positioning.js';
import { getAccentedElementNames, issuesUrl } from './constants.js';
import logAndRethrow from './log-and-rethrow.js';
import createShadowDOMAwareMutationObserver from './utils/shadow-dom-aware-mutation-observer.js';

export default function createScanner(name: string, axeContext: AxeContext, axeOptions: AxeOptions, throttle: Required<Throttle>, callback: Callback) {
  const axeRunningWindowProp = `__${name}_axe_running__`;
  const win: Record<string, any> = window;
  const taskQueue = new TaskQueue<Node>(async () => {
    // We may see errors coming from axe-core when Accented is toggled off and on in qiuck succession,
    // which I've seen happen with hot reloading of a React application.
    // This window property serves as a circuit breaker for that particular case.
    if (win[axeRunningWindowProp]) {
      return;
    }

    try {

      performance.mark('scan-start');

      win[axeRunningWindowProp] = true;

      let result;

      try {
        // TODO (https://github.com/pomerantsev/accented/issues/102):
        // only run Axe on what's changed, not on the whole axeContext
        result = await axe.run(axeContext, {
          elementRef: true,
          // Although axe-core can perform iframe scanning, I haven't succeeded in it,
          // and the docs suggest that the axe-core script should be explicitly included
          // in each of the iframed documents anyway.
          // It seems preferable to disallow iframe scanning and not report issues in elements within iframes
          // in the case that such issues are for some reason reported by axe-core.
          // A consumer of Accented can instead scan the iframed document by calling Accented initialization from that document.
          iframes: false,
          resultTypes: ['violations'],
          ...axeOptions
        });
      } catch (error) {
        console.error(
          'Accented: axe-core (the accessibility testing engine) threw an error. ' +
            'Check the `axeOptions` property that you’re passing to Accented. ' +
            `If you still think it’s a bug in Accented, file an issue at ${issuesUrl}.\n`,
          error
        );
        result = { violations: [] };
      }
      win[axeRunningWindowProp] = false;

      const scanMeasure = performance.measure('scan', 'scan-start');
      const scanDuration = Math.round(scanMeasure.duration);

      if (!enabled.value) {
        return;
      }

      performance.mark('dom-update-start');

      updateElementsWithIssues(extendedElementsWithIssues, result.violations, window, name);

      const domUpdateMeasure = performance.measure('dom-update', 'dom-update-start');
      const domUpdateDuration = Math.round(domUpdateMeasure.duration);

      callback({
        elementsWithIssues: elementsWithIssues.value,
        performance: {
          totalBlockingTime: scanDuration + domUpdateDuration,
          scan: scanDuration,
          domUpdate: domUpdateDuration
        }
      });
    } catch (error) {
      win[axeRunningWindowProp] = false;
      logAndRethrow(error);
    }
  }, throttle);

  // TODO (https://github.com/pomerantsev/accented/issues/102):
  // limit to what's in axeContext,
  // if that's an element or array of elements (not a selector).
  taskQueue.add(document);

  const accentedElementNames = getAccentedElementNames(name);
  const mutationObserver = createShadowDOMAwareMutationObserver(name, mutationList => {
    try {
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
    } catch (error) {
      logAndRethrow(error);
    }
  });

  // TODO (https://github.com/pomerantsev/accented/issues/102):
  // possibly limit the observer to what's in axeContext,
  // if that's an element or array of elements (not a selector).
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
