
import registerElements from './register-elements.js';
import createDomUpdater from './dom-updater.js';
import createLogger from './logger.js';
import createScanner from './scanner.js';
import { enabled, extendedElementsWithIssues } from './state.js';
import deepMerge from './utils/deep-merge.js';
import type { DeepRequired, AccentedOptions, DisableAccented } from './types';
import validateOptions from './validate-options.js';
import recalculatePositions from './utils/recalculate-positions.js';

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
  const cleanupScanner = createScanner(name, throttle, callback);
  const cleanupDomUpdater = createDomUpdater(name);
  const cleanupLogger = output.console ? createLogger() : () => {};

  // TODO: move this to a separate file.
  // TODO: create a helper function to determine support.
  if (!(CSS.supports('anchor-name: --foo') && CSS.supports('position-anchor: --foo'))) {
    // TODO: remove event listener on cleanup.
    document.addEventListener('scroll', () => {
      recalculatePositions();
    });

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
  };
}
