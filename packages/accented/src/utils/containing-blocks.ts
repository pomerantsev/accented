/**
 * Tests whether a particular combination of CSS property and value on an element
 * makes that element a containing block.
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block
 *
 * The function is meant to be run with properties that behave inconsistently across browsers.
 *
 * It's only meant to be used during initialization.
 */
function testContainingBlockCreation<T extends keyof CSSStyleDeclaration>(
  prop: T,
  value: CSSStyleDeclaration[T],
) {
  const container = document.createElement('div');
  container.style[prop] = value;
  container.style.position = 'fixed';
  container.style.insetInlineStart = '10px';
  container.style.insetBlockStart = '10px';

  const element = document.createElement('div');
  element.style.position = 'fixed';
  element.style.insetInlineStart = '0';
  element.style.insetBlockStart = '0';

  container.appendChild(element);
  document.body.appendChild(container);
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  container.remove();

  return containerRect.top === elementRect.top && containerRect.left === elementRect.left;
}

// This is the set we'll use to store the properties that _may_ create containing blocks
// (the behavior of the ones that we'll be checking is inconsistent across browsers
// at the time of writing this comment).
const propsAffectingContainingBlocks = new Set<keyof CSSStyleDeclaration>();

export function createsContainingBlock(prop: keyof CSSStyleDeclaration) {
  return propsAffectingContainingBlocks.has(prop);
}

export function initializeContainingBlockSupportSet() {
  type StyleEntry<T extends keyof CSSStyleDeclaration> = {
    [K in T]: { prop: K; value: CSSStyleDeclaration[K] };
  }[T];

  const propsToTest: Array<StyleEntry<'filter' | 'backdropFilter' | 'containerType'>> = [
    { prop: 'filter', value: 'blur(1px)' },
    { prop: 'backdropFilter', value: 'blur(1px)' },
    { prop: 'containerType', value: 'size' },
  ];

  for (const { prop, value } of propsToTest) {
    if (testContainingBlockCreation(prop, value)) {
      propsAffectingContainingBlocks.add(prop);
    }
  }
}
