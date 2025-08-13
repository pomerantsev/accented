import { createDomUpdater } from './dom-updater.js';
import { setupResizeListener as setupFullscreenListener } from './fullscreen-listener.js';
import { setupIntersectionObserver } from './intersection-observer.js';
import { logAndRethrow } from './log-and-rethrow.js';
import { createLogger } from './logger.js';
import { registerElements } from './register-elements.js';
import { setupResizeListener } from './resize-listener.js';
import { createScanner } from './scanner.js';
import { setupScrollListeners } from './scroll-listeners.js';
import { enabled, extendedElementsWithIssues } from './state.js';
import type { AccentedOptions, DisableAccented } from './types.ts';
import { initializeContainingBlockSupportSet } from './utils/containing-blocks.js';
import { deepMerge } from './utils/deep-merge.js';
import { supportsAnchorPositioning } from './utils/supports-anchor-positioning.js';
import { validateOptions } from './validate-options.js';

export type { AccentedOptions, DisableAccented };

/**
 * Enables the continuous scanning and highlighting of accessibility issues on the page.
 *
 * @param {AccentedOptions} options - The options object (optional).
 *
 * @returns A `disable` function that takes no parameters. When called, disables the scanning and highlighting, and cleans up any changes that Accented has made to the page.
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
 *     console.log('Elements with issues:', elementsWithIssues);
 *     console.log('Total blocking time:', performance.totalBlockingTime);
 *   }
 * });
 */
export function accented(options: AccentedOptions = {}): DisableAccented {
  validateOptions(options);

  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn(
        'Accented: this script can only run in the browser, and it’s likely running on the server now. Exiting.',
      );
      console.trace();
      return () => {};
    }

    const defaultOutput: Required<AccentedOptions['output']> = {
      console: true,
      page: true,
    };

    const defaultThrottle: Required<AccentedOptions['throttle']> = {
      wait: 1000,
      leading: true,
    };

    // IMPORTANT: when changing any of the properties or values, also do the following:
    // * update the default value in the type documentation accordingly;
    // * update validations and validation tests if necessary;
    // * update examples in the accented() function JSDoc;
    // * update examples in the Readme.
    const defaultOptions: Required<AccentedOptions> = {
      context: document,
      axeOptions: {},
      name: 'accented',
      output: defaultOutput,
      throttle: defaultThrottle,
      callback: () => {},
    };

    const { context, axeOptions, name, output, throttle, callback } = deepMerge(
      defaultOptions,
      options,
    );

    if (enabled.value) {
      console.warn(
        'You are trying to run the Accented library more than once, which may lead to errors. See https://accented.dev/getting-started#run-once-per-page',
      );
      console.trace();
    }

    enabled.value = true;

    initializeContainingBlockSupportSet();
    registerElements(name);

    const { disconnect: cleanupIntersectionObserver, intersectionObserver } =
      setupIntersectionObserver();
    const cleanupScanner = createScanner(name, context, axeOptions, throttle, callback);
    const cleanupDomUpdater = output.page ? createDomUpdater(name, intersectionObserver) : () => {};
    const cleanupLogger = output.console ? createLogger() : () => {};
    const cleanupScrollListeners = setupScrollListeners();
    const cleanupResizeListener = supportsAnchorPositioning(window)
      ? () => {}
      : setupResizeListener();
    const cleanupFullscreenListener = supportsAnchorPositioning(window)
      ? () => {}
      : setupFullscreenListener();

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
