
import registerElements from './register-elements.js';
import createDomUpdater from './dom-updater.js';
import createLogger from './logger.js';
import createScanner from './scanner.js';
import setupScrollListeners from './scroll-listeners.js';
import { enabled, extendedElementsWithIssues } from './state.js';
import deepMerge from './utils/deep-merge.js';
import type { DeepRequired, AccentedOptions, DisableAccented } from './types';
import validateOptions from './validate-options.js';
import recalculatePositions from './utils/recalculate-positions.js';
import supportsAnchorPositioning from './utils/supports-anchor-positioning.js';
import getElementPosition from './utils/get-element-position.js';

export type { AccentedOptions, DisableAccented };

// IMPORTANT: when changing any of the properties or values, also do the following:
// * update the default value in the type documentation accordingly;
// * update validations and validation tests if necessary;
// * update examples in the accented() function JSDoc;
// * update examples in the Readme.
const defaultOptions: DeepRequired<AccentedOptions> = {
  name: 'accented',
  output: {
    console: true
  },
  throttle: {
    wait: 1000,
    leading: true
  },
  callback: () => {}
};

/**
 * Enables highlighting of elements with accessibility issues.
 *
 * @param {AccentedOptions} options - The options object.
 *
 * @returns A `disable` function that can be called to stop the scanning and highlighting.
 *
 * @example
 * accented();
 *
 * @example
 * const disableAccented = accented({
 *   output: {
 *     console: false
 *   },
 *   throttle: {
 *     wait: 500,
 *     leading: false
 *   },
 *   callback: ({ elementsWithIssues, scanDuration }) => {
 *    console.log('Elements with issues:', elementsWithIssues);
 *    console.log('Scan duration:', scanDuration);
 *   }
 * });
 */
export default function accented(options: AccentedOptions = {}): DisableAccented {

  validateOptions(options);

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('Accented: this script can only run in the browser, and it’s likely running on the server now. Exiting.');
    console.trace();
    return () => {};
  }

  const {name, output, throttle, callback} = deepMerge(defaultOptions, options);

  if (enabled.value) {
    // TODO: add link to the recipes section of the docs.
    console.warn(
      'You are trying to run the Accented library more than once. ' +
      'This will likely lead to errors.'
    );
    console.trace();
  }

  enabled.value = true;

  registerElements(name);

  const intersectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const extendedElementWithIssues = extendedElementsWithIssues.value.find(el => el.element === entry.target);
      if (extendedElementWithIssues) {
        extendedElementWithIssues.visible.value = entry.isIntersecting;
        if (entry.isIntersecting) {
          extendedElementWithIssues.position.value = getElementPosition(entry.target, window);
        }
      }
    }
  }, { threshold: 0 });

  const cleanupScanner = createScanner(name, throttle, callback);
  const cleanupDomUpdater = createDomUpdater(name, intersectionObserver);
  const cleanupLogger = output.console ? createLogger() : () => {};
  const cleanupScrollListeners = supportsAnchorPositioning() ? () => {} : setupScrollListeners();

  // TODO: move this to a separate file.
  if (!supportsAnchorPositioning()) {
    // TODO: remove event listener on cleanup.
    window.addEventListener('resize', () => {
      recalculatePositions();
    });
  }

  return () => {
    enabled.value = false;
    extendedElementsWithIssues.value = [];
    cleanupScanner();
    cleanupDomUpdater();
    cleanupLogger();
    cleanupScrollListeners();
  };
}
