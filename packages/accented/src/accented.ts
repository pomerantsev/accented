
import createDomUpdater from './dom-updater.js';
import createLogger from './logger.js';
import createScanner from './scanner.js';
import { enabled } from './state.js';
import deepMerge from './utils/deep-merge.js';

type DeepPartial<T> = T extends object ? {
  [P in keyof T]? : DeepPartial<T[P]>
} : T;

type Throttle = {
  /** The time to wait between scans. */
  wait: number,

  /** Whether to run the scan immediately on Accented initialization or on a mutation. */
  leading: boolean
}

export type Options = {
  /** Whether to output the issues to the console. */
  outputToConsole: boolean,

  /** Scan throttling options. */
  throttle: Throttle
};

const defaultOptions: Options = {
  outputToConsole: true,
  throttle: {
    wait: 1000,
    leading: true
  }
};

export type AccentedInstance = () => void;

/**
 * Enables highlighting of elements with accessibility issues.
 *
 * @param {Options} options - The options object.
 *
 * @returns A `disable` function that can be called to stop the scanning and highlighting.
 *
 * @example
 * accented();
 *
 * @example
 * const disableAccented = accented({
 *   outputToConsole: false,
 *   throttle: {
 *     wait: 500,
 *     leading: false
 *   }
 * });
 */
export default function accented(options: DeepPartial<Options> = {}): AccentedInstance {
  const {outputToConsole, throttle: { wait, leading }} = deepMerge(defaultOptions, options);
  const initialDelay = leading ? 0 : wait;
  const throttleDelay = wait;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('Accented: this script can only run in the browser, and it’s likely running on the server now. Exiting.');
    console.trace();
    return () => {};
  }

  if (enabled.value) {
    // TODO: add link to relevant docs
    console.warn(
      'You are trying to run the Accented library more than once. ' +
      'This will likely lead to errors.'
    );
    console.trace();
  }

  enabled.value = true;
  const cleanupScanner = createScanner(initialDelay, throttleDelay);
  const cleanupDomUpdater = createDomUpdater();
  const cleanupLogger = outputToConsole ? createLogger() : () => {};

  return () => {
    enabled.value = false;
    cleanupScanner();
    cleanupDomUpdater();
    cleanupLogger();
  };
}
