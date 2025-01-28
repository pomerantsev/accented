import type { AccentedOptions } from './types';

export default function validateOptions(options: AccentedOptions) {
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
}
