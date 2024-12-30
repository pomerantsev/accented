import type { AxeResults } from 'axe-core';

export default function issuesToElements(issues: typeof AxeResults.violations) {
  const elements: Set<Element> = new Set();

  for (const issue of issues) {
    for (const node of issue.nodes) {
      if (node.element) {
        elements.add(node.element);
      }
    }
  }

  return [...elements];
}
