import type { Issue } from './types';

export const accentedUrl = 'https://accented.dev';
export const issuesUrl = 'https://github.com/pomerantsev/accented/issues';
export const getAccentedElementNames = (name: string) => [`${name}-trigger`, `${name}-dialog`];

export const orderedImpacts: Array<Issue['impact']> = ['minor', 'moderate', 'serious', 'critical'];

/**
 * axe-core rules whose pass/fail depends on the presence or absence of specific descendants
 * (not just direct children). When any DOM mutation occurs, these rules must be re-evaluated
 * against the full scan context, because the mutated node may be deep inside the element
 * that the violation is reported on — and therefore outside the incremental scan context.
 */
export const ancestorDependentRules = new Set([
  'aria-hidden-focus',
  'aria-required-children',
  'aria-text',
  'document-title',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'landmark-no-duplicate-main',
  'landmark-one-main',
  'nested-interactive',
  'page-has-heading-one',
]);
