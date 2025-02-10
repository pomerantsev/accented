import type { AccentedOptions } from './types';

// The space of valid CSS and HTML names is wider than this,
// but with Unicode it gets complicated quickly, so I'm sticking to only allowing
// lowercase alphanumeric names that possibly contain dashes that start with a letter.
const nameRegex = /^[a-z]([a-z0-9]|-)+$/;

export default function validateOptions(options: AccentedOptions) {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`Invalid argument: the options parameter must be an object if provided. It’s currently set to ${options}.`);
  }
  if (options.throttle !== undefined) {
    if (typeof options.throttle !== 'object' || options.throttle === null) {
      throw new TypeError(`Invalid argument: \`throttle\` option must be an object if provided. It’s currently set to ${options.throttle}.`);
    }
    if (options.throttle.wait !== undefined && (typeof options.throttle.wait !== 'number' || options.throttle.wait < 0)) {
      throw new TypeError(`Invalid argument: \`throttle.wait\` option must be a non-negative number if provided. It’s currently set to ${options.throttle.wait}.`);
    }
  }
  if (options.output !== undefined) {
    if (typeof options.output !== 'object' || options.output === null) {
      throw new TypeError(`Invalid argument: \`output\` option must be an object if provided. It’s currently set to ${options.output}.`);
    }
    if (options.output.console !== undefined && typeof options.output.console !== 'boolean') {
      console.warn(`Invalid argument: \`output.console\` option is expected to be a boolean. It’s currently set to ${options.output.console}.`);
    }
  }
  if (options.callback !== undefined && typeof options.callback !== 'function') {
    throw new TypeError(`Invalid argument: \`callback\` option must be a function if provided. It’s currently set to ${options.callback}.`);
  }
  if (options.name !== undefined && (typeof options.name !== 'string' || !options.name.match(nameRegex))) {
    throw new TypeError(`Invalid argument: \`name\` option must be a string that starts with a lowercase letter and only contains lowercase alphanumeric characters and dashes. It’s currently set to ${options.name}.`);
  }
}
