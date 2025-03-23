
import registerElements from './register-elements.js';
import createDomUpdater from './dom-updater.js';
import createLogger from './logger.js';
import createScanner from './scanner.js';
import setupScrollListeners from './scroll-listeners.js';
import setupResizeListener from './resize-listener.js';
import setupFullscreenListener from './fullscreen-listener.js';
import setupIntersectionObserver from './intersection-observer.js';
import { enabled, extendedElementsWithIssues } from './state.js';
import deepMerge from './utils/deep-merge.js';
import type { AccentedOptions, DisableAccented } from './types';
import validateOptions from './validate-options.js';
import supportsAnchorPositioning from './utils/supports-anchor-positioning.js';
import logAndRethrow from './log-and-rethrow.js';

export type { AccentedOptions, DisableAccented };

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
 *   callback: ({ elementsWithIssues, performance }) => {
 *    console.log('Elements with issues:', elementsWithIssues);
 *    console.log('Total blocking time:', performance.totalBlockingTime);
 *   }
 * });
 */
export default function accented(options: AccentedOptions = {}): DisableAccented {

  validateOptions(options);

  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('Accented: this script can only run in the browser, and it’s likely running on the server now. Exiting.');
      console.trace();
      return () => {};
    }

    const defaultOutput: Required<AccentedOptions['output']> = {
      console: true
    };

    const defaultThrottle: Required<AccentedOptions['throttle']> = {
      wait: 1000,
      leading: true
    };

    // IMPORTANT: when changing any of the properties or values, also do the following:
    // * update the default value in the type documentation accordingly;
    // * update validations and validation tests if necessary;
    // * update examples in the accented() function JSDoc;
    // * update examples in the Readme.
    const defaultOptions: Required<AccentedOptions> = {
      axeContext: document,
      axeOptions: {},
      name: 'accented',
      output: defaultOutput,
      throttle: defaultThrottle,
      callback: () => {}
    };

    const {axeContext, axeOptions, name, output, throttle, callback} = deepMerge(defaultOptions, options);

    if (enabled.value) {
      // Add link to the recipes section of the docs (#56).
      console.warn(
        'You are trying to run the Accented library more than once. ' +
        'This will likely lead to errors.'
      );
      console.trace();
    }

    enabled.value = true;

    registerElements(name);

    const {disconnect: cleanupIntersectionObserver, intersectionObserver } = supportsAnchorPositioning(window) ? {} : setupIntersectionObserver();
    const cleanupScanner = createScanner(name, axeContext, axeOptions, throttle, callback);
    const cleanupDomUpdater = createDomUpdater(name, intersectionObserver);
    const cleanupLogger = output.console ? createLogger() : () => {};
    const cleanupScrollListeners = supportsAnchorPositioning(window) ? () => {} : setupScrollListeners();
    const cleanupResizeListener = supportsAnchorPositioning(window) ? () => {} : setupResizeListener();
    const cleanupFullscreenListener = supportsAnchorPositioning(window) ? () => {} : setupFullscreenListener();

    return () => {
      try {
        enabled.value = false;
        extendedElementsWithIssues.value = [];
        cleanupScanner();
        cleanupDomUpdater();
        cleanupLogger();
        cleanupScrollListeners();
        cleanupResizeListener();
        cleanupFullscreenListener();
        if (cleanupIntersectionObserver) {
          cleanupIntersectionObserver();
        }
      } catch (error) {
        logAndRethrow(error);
      }
    };
  } catch (error) {
    logAndRethrow(error);
    return () => {};
  }
}
