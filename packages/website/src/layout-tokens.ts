// Single source for layout values used by both CSS (via `define:vars` in MainLayout.astro) and markup.

const baseSizeRem = 1;

const spaceMultipliers = {
  '3xs': 0.25,
  '2xs': 0.5,
  xs: 0.75,
  s: 1,
  m: 1.5,
  l: 2,
  xl: 3,
  '2xl': 4,
  '3xl': 6,
};

const contentMaxWidthRem = 40;

const pagePaddingNarrowRem = spaceMultipliers.l * baseSizeRem;

export const cssLayoutVars = {
  'base-size': `${baseSizeRem}rem`,
  ...Object.fromEntries(
    Object.entries(spaceMultipliers).map(([name, multiplier]) => [
      `space-${name}`,
      `${multiplier * baseSizeRem}rem`,
    ]),
  ),
  'content-max-width': `${contentMaxWidthRem}rem`,
  'page-padding-narrow': `${pagePaddingNarrowRem}rem`,
};

// Assumes that once `body`'s wider padding applies (media query in global.css),
// the content is already at its max width, and that CSS doesn't change the root font size.
export const contentImageSizes = `(max-width: ${contentMaxWidthRem + 2 * pagePaddingNarrowRem}rem) calc(100vw - ${2 * pagePaddingNarrowRem}rem), ${contentMaxWidthRem}rem`;
