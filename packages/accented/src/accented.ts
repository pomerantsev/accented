import axe from 'axe-core';
import TaskQueue from './task-queue';
import DomUpdater from './dom-updater';
import issuesToElements from './utils/issuesToElements';

type AccentedProps = {
  outputToConsole?: boolean
};

const defaultProps: Required<AccentedProps> = {
  outputToConsole: true
};

export default function accented(props: AccentedProps = {}) {
  const {outputToConsole} = {...defaultProps, ...props};

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('Accented can only run in the browser. Exiting now.');
    return;
  }

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
  });

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
}
