import type { Issue } from './types';

export const accentedUrl = 'https://accented.dev';
export const issuesUrl = 'https://github.com/pomerantsev/accented/issues';
export const getAccentedElementNames = (name: string) => [`${name}-trigger`, `${name}-dialog`];

export const orderedImpacts: Array<Issue['impact']> = ['minor', 'moderate', 'serious', 'critical'];
