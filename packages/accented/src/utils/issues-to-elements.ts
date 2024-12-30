import type { AxeResults } from 'axe-core';

export default function issuesToElements(issues: typeof AxeResults.violations) {
  const elements: Set<Element> = new Set();

  for (const issue of issues) {
    for (const node of issue.nodes) {
      // target.length > 1 means that the issue is in an iframe.
      // Although axe-core can perform iframe scanning, I haven't succeeded in it,
      // and the docs suggest that the axe-core script should be explicitly included
      // in each of the iframed documents anyway.
      // It seems preferable to disallow iframe scanning and not report issues in elements within iframes
      // in the case that such issues are for some reason reported by axe-core.
      // A consumer of Accented can instead scan the iframed document by calling Accented initialization from that document.
      if (node.element && node.target.length === 1) {
        elements.add(node.element);
      }
    }
  }

  return [...elements];
}
