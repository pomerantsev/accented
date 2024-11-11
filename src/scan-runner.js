import axe from 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/+esm';

const ADD_EVENT_NAME = 'a11y-hint-add-element';

const elementsToScan = new Set();

let idleCallbackId = null;

// TODO: properly test all this asynchronicity

const scan = async () => {
  idleCallbackId = null;
  elementsToScan.clear();

  performance.mark('axe-start');

  const result = await axe.run();

  const axeMeasure = performance.measure('axe', 'axe-start');

  console.log('Result:', result);
  console.log('Axe run duration:', Math.round(axeMeasure.duration), 'ms');
};

document.addEventListener(ADD_EVENT_NAME, () => {
  if (idleCallbackId === null) {
    // TODO: fallback for browsers that don't support requestIdleCallback
    idleCallbackId = requestIdleCallback(scan);
  }
});

export default {
  add: (element) => {
    elementsToScan.add(element);
    document.dispatchEvent(new Event(ADD_EVENT_NAME));
  }
};
