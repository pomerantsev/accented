import axe from 'axe-core';
import { effect } from '@preact/signals-core';
import TaskQueue from './task-queue.js';
import DomUpdater from './dom-updater.js';
import issuesToElements from './utils/issuesToElements.js';
import { enabled } from './state.js';

export type AccentedProps = {
  outputToConsole: boolean,
  initialDelay: number,
  throttleDelay: number
};

const defaultProps: AccentedProps = {
  outputToConsole: true,
  initialDelay: 0,
  throttleDelay: 1000
};

export type AccentedInstance = {
  stop: () => void
};

export default function accented(props: Partial<AccentedProps> = {}): AccentedInstance {
  const {outputToConsole, initialDelay, throttleDelay} = {...defaultProps, ...props};

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('Accented: this script can only run in the browser, and it’s likely running on the server now. Exiting.');
    console.trace();
    return {
      stop: () => {}
    };
  }

  if (enabled.value) {
    // TODO: add link to relevant docs
    console.warn(
      'You are trying to run the Accented library more than once. ' +
      'This will likely lead to errors.'
    );
    console.trace();
  }

  enabled.value = true;

  const domUpdater = new DomUpdater();

  const taskQueue = new TaskQueue<Node>(async () => {
    performance.mark('axe-start');

    const result = await axe.run();

    const axeMeasure = performance.measure('axe', 'axe-start');

    if (!enabled.value) {
      return;
    }

    const elements = issuesToElements(result.violations);
    domUpdater.update(elements);

    if (outputToConsole) {
      console.log('Result:', result);
    }
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

  effect(() => {
    if (enabled.value) {
      // TODO: read more about the params and decide which ones we need.
      mutationObserver.observe(document, {
        subtree: true,
        childList: true,
        attributes: true
      });
    } else {
      mutationObserver.disconnect();
    }
  });

  return {
    stop: () => {
      enabled.value = false;
    }
  };
}
