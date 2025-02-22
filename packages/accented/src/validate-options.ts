import type { AccentedOptions } from './types';
import { allowedAxeOptions } from './types.js';

// The space of valid CSS and HTML names is wider than this,
// but with Unicode it gets complicated quickly, so I'm sticking to only allowing
// lowercase alphanumeric names that possibly contain dashes that start with a letter.
const nameRegex = /^[a-z]([a-z0-9]|-)+$/;

export default function validateOptions(options: AccentedOptions) {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`Accented: invalid argument. The options parameter must be an object if provided. It’s currently set to ${options}.`);
  }
  if (options.throttle !== undefined) {
    if (typeof options.throttle !== 'object' || options.throttle === null) {
      throw new TypeError(`Accented: invalid argument. \`throttle\` option must be an object if provided. It’s currently set to ${options.throttle}.`);
    }
    if (options.throttle.wait !== undefined && (typeof options.throttle.wait !== 'number' || options.throttle.wait < 0)) {
      throw new TypeError(`Accented: invalid argument. \`throttle.wait\` option must be a non-negative number if provided. It’s currently set to ${options.throttle.wait}.`);
    }
  }
  if (options.output !== undefined) {
    if (typeof options.output !== 'object' || options.output === null) {
      throw new TypeError(`Accented: invalid argument. \`output\` option must be an object if provided. It’s currently set to ${options.output}.`);
    }
    if (options.output.console !== undefined && typeof options.output.console !== 'boolean') {
      console.warn(`Accented: invalid argument. \`output.console\` option is expected to be a boolean. It’s currently set to ${options.output.console}.`);
    }
  }
  if (options.callback !== undefined && typeof options.callback !== 'function') {
    throw new TypeError(`Accented: invalid argument. \`callback\` option must be a function if provided. It’s currently set to ${options.callback}.`);
  }
  if (options.name !== undefined && (typeof options.name !== 'string' || !options.name.match(nameRegex))) {
    throw new TypeError(`Accented: invalid argument. \`name\` option must be a string that starts with a lowercase letter and only contains lowercase alphanumeric characters and dashes. It’s currently set to ${options.name}.`);
  }
  if (options.axeOptions !== undefined) {
    if (typeof options.axeOptions !== 'object' || options.axeOptions === null) {
      throw new TypeError(`Accented: invalid argument. \`axeOptions\` option must be an object if provided. It’s currently set to ${options.axeOptions}.`);
    }
    const unsupportedKeys = Object.keys(options.axeOptions).filter(key => !(allowedAxeOptions as unknown as Array<string>).includes(key));
    if (unsupportedKeys.length > 0) {
      throw new TypeError(`Accented: invalid argument. \`axeOptions\` contains the following unsupported keys: ${unsupportedKeys.join(', ')}. Valid options are: ${allowedAxeOptions.join(', ')}.`);
    }
  }
}
