import axe from 'axe-core';
import TaskQueue from './task-queue.js';
import DomUpdater from './dom-updater.js';
import issuesToElements from './utils/issuesToElements.js';

declare global {
  interface Window {
    __ACCENTED_RUNNING__: boolean;
  }
}

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

  if (window.__ACCENTED_RUNNING__) {
    console.warn(
      'You are trying to run the Accented library more than once. ' +
      'This will likely lead to errors.'
    );
    // TODO: add link to relevant docs
  }

  window.__ACCENTED_RUNNING__ = true;

  const domUpdater = new DomUpdater();

  const taskQueue = new TaskQueue<Node>(async () => {
    performance.mark('axe-start');

    const result = await axe.run();

    const axeMeasure = performance.measure('axe', 'axe-start');

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

  // TODO: read more about the params and decide which ones we need.
  mutationObserver.observe(document, {
    subtree: true,
    childList: true,
    attributes: true
  });

  return {
    stop: () => {
      mutationObserver.disconnect();
      window.__ACCENTED_RUNNING__ = false;
    }
  };
}
