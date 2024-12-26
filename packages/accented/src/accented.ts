
import createDomUpdater from './dom-updater.js';
import createLogger from './logger.js';
import createScanner from './scanner.js';
import state from './state.js';

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

  if (state.enabled) {
    // TODO: add link to relevant docs
    console.warn(
      'You are trying to run the Accented library more than once. ' +
      'This will likely lead to errors.'
    );
    console.trace();
  }

  state.enabled = true;
  const cleanupScanner = createScanner(initialDelay, throttleDelay);
  const cleanupDomUpdater = createDomUpdater();
  const cleanupLogger = outputToConsole ? createLogger() : () => {};

  return () => {
    state.abortController.abort();
    // TODO: going back to the initial state should probably happen in a more consolidated way
    state.enabled = false;
    state.abortController = new AbortController();
    cleanupScanner();
    cleanupDomUpdater();
    cleanupLogger();
  };
}
