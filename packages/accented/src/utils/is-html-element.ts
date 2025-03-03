export default function isHtmlElement(element: Element): element is HTMLElement {
  // We can't use instanceof because it may not work across contexts
  // (such as when an element is moved from an iframe).
  // This heuristic seems to be the most robust and fastest that I could think of.
  return element.constructor.name.startsWith('HTML');
}
