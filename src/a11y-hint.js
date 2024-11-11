import scanRunner from './scan-runner.js';

scanRunner.add(document);

const mutationObserver = new MutationObserver(mutationList => {
  // TODO: filter out irrelevant mutations
  for (const mutationRecord of mutationList) {
    scanRunner.add(mutationRecord.target);
  }
});

// TODO: read more about the params and decide which ones we need.
mutationObserver.observe(document, {
  subtree: true,
  childList: true,
  attributes: true
});
