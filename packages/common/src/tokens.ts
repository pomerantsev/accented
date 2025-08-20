export const primaryColorDark = 'oklch(0.5 0.3 0)';
export const primaryColorLight = 'oklch(0.8 0.2 0)';
export const colorLight = 'oklch(0.98 0 0)';
export const colorDark = 'oklch(0.22 0 0)';

const hueGray = 0;
const hueBlue = 230;
const hueGold = 90;
const hueRed = 0;

const focusLightnessLight = 0.45;
const focusLightnessDark = 0.8;
const chromaFocus = 0.25;

export const colorFocus = `light-dark(oklch(${focusLightnessLight} ${chromaFocus} ${hueBlue}), oklch(${focusLightnessDark} ${chromaFocus} ${hueBlue}))`;

const impactLightnessLight = 0.8;
const impactLightnessDark = 0.45;
const chromaImpactGray = 0;
const chromaImpactNonGray = 0.16;

const colorImpactMinorLight = `oklch(${impactLightnessLight} ${chromaImpactGray} ${hueGray})`;
const colorImpactModerateLight = `oklch(${impactLightnessLight} ${chromaImpactNonGray} ${hueBlue})`;
const colorImpactSeriousLight = `oklch(${impactLightnessLight} ${chromaImpactNonGray} ${hueGold})`;
const colorImpactCriticalLight = `oklch(${impactLightnessLight} ${chromaImpactNonGray} ${hueRed})`;

const colorImpactMinorDark = `oklch(${impactLightnessDark} ${chromaImpactGray} ${hueGray})`;
const colorImpactModerateDark = `oklch(${impactLightnessDark} ${chromaImpactNonGray} ${hueBlue})`;
const colorImpactSeriousDark = `oklch(${impactLightnessDark} ${chromaImpactNonGray} ${hueGold})`;
const colorImpactCriticalDark = `oklch(${impactLightnessDark} ${chromaImpactNonGray} ${hueRed})`;

export const colorImpactMinor = `light-dark(${colorImpactMinorLight}, ${colorImpactMinorDark})`;
export const colorImpactModerate = `light-dark(${colorImpactModerateLight}, ${colorImpactModerateDark})`;
export const colorImpactSerious = `light-dark(${colorImpactSeriousLight}, ${colorImpactSeriousDark})`;
export const colorImpactCritical = `light-dark(${colorImpactCriticalLight}, ${colorImpactCriticalDark})`;

export const consoleColorImpactMinor = `light-dark(${colorImpactMinorDark}, ${colorImpactMinorLight})`;
export const consoleColorImpactModerate = `light-dark(${colorImpactModerateDark}, ${colorImpactModerateLight})`;
export const consoleColorImpactSerious = `light-dark(${colorImpactSeriousDark}, ${colorImpactSeriousLight})`;
export const consoleColorImpactCritical = `light-dark(${colorImpactCriticalDark}, ${colorImpactCriticalLight})`;

/* https://systemfontstack.com/ */
export const fontSystemSans =
  '-apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, Adwaita Sans, Cantarell, Ubuntu, roboto, noto, helvetica, arial, sans-serif';
export const fontSystemMono =
  'Menlo, Consolas, Monaco, Adwaita Mono, Liberation Mono, Lucida Console, monospace';
