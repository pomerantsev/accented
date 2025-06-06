export function getElementHtml(element: Element) {
  const outerHtml = element.outerHTML;
  const innerHtml = element.innerHTML;
  if (!innerHtml) {
    return outerHtml;
  }
  const index = outerHtml.indexOf(innerHtml);
  if (index === -1) {
    // This shouldn't be happening, but if it does, we can just return the outer HTML.
    return outerHtml;
  }
  const openingTag = outerHtml.slice(0, index);
  const closingTag = outerHtml.slice(index + innerHtml.length);
  return `${openingTag}…${closingTag}`;
}
