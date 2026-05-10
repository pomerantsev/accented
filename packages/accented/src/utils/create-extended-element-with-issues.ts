import { signal } from '@preact/signals-core';
import type { AccentedDialog } from '../elements/accented-dialog.ts';
import type { AccentedTrigger } from '../elements/accented-trigger.ts';
import type { ElementWithIssues, ExtendedElementWithIssues } from '../types.ts';
import { isSvgElement } from './dom-helpers.js';
import { getElementPosition } from './get-element-position.js';
import { getParent } from './get-parent.js';
import { getScrollableAncestors } from './get-scrollable-ancestors.js';
import { supportsAnchorPositioning } from './supports-anchor-positioning.js';

function shouldSkipRender(element: Element): boolean {
  // Skip rendering if the element is inside an SVG:
  // https://github.com/pomerantsev/accented/issues/62
  const parent = getParent(element);
  const isInsideSvg = Boolean(parent && isSvgElement(parent));

  // Some issues, such as meta-viewport, are on <head> descendants,
  // but since <head> is never rendered, we don't want to output anything
  // for those in the DOM.
  // We're not anticipating the use of shadow DOM in <head>,
  // so the use of .closest() should be fine.
  const isInsideHead = element.closest('head') !== null;

  return isInsideSvg || isInsideHead;
}

let count = 0;

export function createExtendedElementWithIssues(
  elementWithIssues: ElementWithIssues,
  name: string,
): ExtendedElementWithIssues {
  const id = count++;
  const trigger = document.createElement(`${name}-trigger`) as AccentedTrigger;
  const elementZIndex = Number.parseInt(getComputedStyle(elementWithIssues.element).zIndex, 10);
  if (!Number.isNaN(elementZIndex)) {
    trigger.style.setProperty('z-index', (elementZIndex + 1).toString(), 'important');
  }
  trigger.style.setProperty('position-anchor', `--${name}-anchor-${id}`, 'important');
  trigger.dataset.id = id.toString();
  const accentedDialog = document.createElement(`${name}-dialog`) as AccentedDialog;
  trigger.dialog = accentedDialog;
  const position = getElementPosition(elementWithIssues.element);
  trigger.position = signal(position);
  trigger.visible = signal(true);
  trigger.element = elementWithIssues.element;
  const scrollableAncestors = supportsAnchorPositioning()
    ? new Set<HTMLElement>()
    : getScrollableAncestors(elementWithIssues.element);
  const issues = signal(elementWithIssues.issues);
  accentedDialog.issues = issues;
  accentedDialog.element = elementWithIssues.element;
  return {
    id,
    element: elementWithIssues.element,
    skipRender: shouldSkipRender(elementWithIssues.element),
    rootNode: elementWithIssues.rootNode,
    visible: trigger.visible,
    position: trigger.position,
    scrollableAncestors: signal(scrollableAncestors),
    anchorNameValue:
      elementWithIssues.element.style.getPropertyValue('anchor-name') ||
      getComputedStyle(elementWithIssues.element).getPropertyValue('anchor-name'),
    trigger,
    issues,
  };
}
