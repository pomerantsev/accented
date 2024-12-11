
import createDomUpdater from './dom-updater.js';
import createLogger from './logger.js';
import createScanner from './scanner.js';
import { enabled } from './state.js';

export type AccentedProps = {
  outputToConsole: boolean,
  initialDelay: number,
  throttleDelay: number
};

const defaultProps: AccentedProps = {
  outputToConsole: true,
  initialDelay: 0,
  throttleDelay: 1000
};

export type AccentedInstance = () => void;

export default function accented(props: Partial<AccentedProps> = {}): AccentedInstance {
  const {outputToConsole, initialDelay, throttleDelay} = {...defaultProps, ...props};

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
