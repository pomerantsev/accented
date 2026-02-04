/**
 * Some browsers (at the time of this writing, Chrome 144+) started to take CSS transforms into account
 * when calculating the position of the anchored element.
 *
 * In light of this, this utility helps determine if we need to apply a separate transform to the anchored element
 * when it's added to the DOM.
 */

let doesAffect: boolean;

export function cssTransformsAffectAnchorPositioning() {
  return doesAffect;
}

/**
 * This function is supposed to run once at library initialization.
 * It creates two elements (an anchor and an anchored element),
 * with a transform applied to the anchor, and determines whether
 * their positions still match.
 */
export function initializeCssTransformsCheck() {
  const anchor = document.createElement('div');
  anchor.style.inlineSize = '100px';
  anchor.style.blockSize = '100px';
  anchor.style.transform = 'translateX(100px)';
  // @ts-expect-error TS is unaware of `anchor-name`
  anchor.style.anchorName = '--test-anchor';

  const anchored = document.createElement('div');
  anchored.style.inlineSize = '10px';
  anchored.style.blockSize = '10px';
  anchored.style.position = 'absolute';
  // @ts-expect-error TS is unaware of `position-anchor`
  anchored.style.positionAnchor = '--test-anchor';
  anchored.style.insetInlineStart = 'anchor(start)';
  anchored.style.insetBlockStart = 'anchor(start)';

  document.body.appendChild(anchor);
  document.body.appendChild(anchored);

  doesAffect = anchor.getBoundingClientRect().left === anchored.getBoundingClientRect().left;

  anchor.remove();
  anchored.remove();
}
