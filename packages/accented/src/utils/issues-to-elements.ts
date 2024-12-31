import type { AxeResults } from 'axe-core';

export default function issuesToElements(issues: typeof AxeResults.violations) {
  const elements: Set<HTMLElement> = new Set();

  for (const issue of issues) {
    for (const node of issue.nodes) {
      const { element, target } = node;

      // Although axe-core can perform iframe scanning, I haven't succeeded in it,
      // and the docs suggest that the axe-core script should be explicitly included
      // in each of the iframed documents anyway.
      // It seems preferable to disallow iframe scanning and not report issues in elements within iframes
      // in the case that such issues are for some reason reported by axe-core.
      // A consumer of Accented can instead scan the iframed document by calling Accented initialization from that document.
      const isInIframe = target.length > 1;

      // Highlighting elements in shadow DOM is not yet supported, see https://github.com/pomerantsev/accented/issues/25
      // Until then, we don’t want such elements to be added to the set.
      const isInShadowDOM = Array.isArray(target[0]);

      if (element && !isInIframe && !isInShadowDOM) {
        elements.add(element);
      }
    }
  }

  return [...elements];
}
