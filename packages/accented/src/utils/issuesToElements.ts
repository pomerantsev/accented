import type { AxeResults } from 'axe-core';

export default function issuesToElements(issues: typeof AxeResults.violations) {
  const elements: Set<Element> = new Set();

  for (const issue of issues) {
    for (const node of issue.nodes) {
      // TODO: make this work for iframes and Shadow DOM
      if (typeof node.target[0] === 'string') {
        const element = document.querySelector(node.target[0]);
        if (element) {
          elements.add(element);
        }
      }
    }
  }

  return [...elements];
}
