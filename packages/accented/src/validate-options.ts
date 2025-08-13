import { allowedAxeOptions } from './types.js';
import type {
  AccentedOptions,
  Context,
  ContextObject,
  ContextProp,
  Selector,
  SelectorList,
} from './types.ts';
import { isNode, isNodeList } from './utils/dom-helpers.js';

function isSelector(contextFragment: Context): contextFragment is Selector {
  return (
    typeof contextFragment === 'string' ||
    isNode(contextFragment) ||
    'fromShadowDom' in contextFragment
  );
}

function validateSelector(selector: Selector) {
  if (typeof selector === 'string') {
    return;
  }
  if (isNode(selector)) {
    return;
  }
  if ('fromShadowDom' in selector) {
    if (
      !Array.isArray(selector.fromShadowDom) ||
      selector.fromShadowDom.length < 2 ||
      !selector.fromShadowDom.every((item) => typeof item === 'string')
    ) {
      throw new TypeError(
        `Accented: invalid argument. \`fromShadowDom\` must be an array of strings with at least 2 elements. It’s currently set to ${selector.fromShadowDom}.`,
      );
    }
    return;
  }
  const neverSelector: never = selector;
  throw new TypeError(
    `Accented: invalid argument. The selector must be one of: string, Node, or an object with a \`fromShadowDom\` property. It’s currently set to ${neverSelector}.`,
  );
}

function isSelectorList(contextFragment: Context): contextFragment is SelectorList {
  return (
    (typeof contextFragment === 'object' && isNodeList(contextFragment)) ||
    (Array.isArray(contextFragment) && contextFragment.every((item) => isSelector(item)))
  );
}

function validateSelectorList(selectorList: SelectorList) {
  if (isNodeList(selectorList)) {
    return;
  }
  if (Array.isArray(selectorList)) {
    for (const selector of selectorList) {
      validateSelector(selector);
    }
  } else {
    const neverSelectorList: never = selectorList;
    throw new TypeError(
      `Accented: invalid argument. The selector list must either be a NodeList or an array. It’s currently set to ${neverSelectorList}.`,
    );
  }
}

function isContextProp(contextFragment: Context): contextFragment is ContextProp {
  return isSelector(contextFragment) || isSelectorList(contextFragment);
}

function validateContextProp(context: Selector | SelectorList) {
  if (isSelector(context)) {
    validateSelector(context);
  } else if (isSelectorList(context)) {
    validateSelectorList(context);
  } else {
    const neverContext: never = context;
    throw new TypeError(
      `Accented: invalid argument. The context property must either be a selector or a selector list. It’s currently set to ${neverContext}.`,
    );
  }
}

function isContextObject(contextFragment: Context): contextFragment is ContextObject {
  return (
    typeof contextFragment === 'object' &&
    contextFragment !== null &&
    ('include' in contextFragment || 'exclude' in contextFragment)
  );
}

function validateContextObject(contextObject: ContextObject) {
  if ('include' in contextObject && contextObject.include !== undefined) {
    validateContextProp(contextObject.include);
  }
  if ('exclude' in contextObject && contextObject.exclude !== undefined) {
    validateContextProp(contextObject.exclude);
  }
}

function validateContext(context: Context) {
  if (isContextProp(context)) {
    validateContextProp(context);
  } else if (isContextObject(context)) {
    validateContextObject(context);
  } else {
    const neverContext: never = context;
    throw new TypeError(
      `Accented: invalid context argument. It’s currently set to ${neverContext}.`,
    );
  }
}

// The space of valid CSS and HTML names is wider than this,
// but with Unicode it gets complicated quickly, so I'm sticking to only allowing
// lowercase alphanumeric names that possibly contain dashes that start with a letter.
const nameRegex = /^[a-z]([a-z0-9]|-)+$/;

export function validateOptions(options: AccentedOptions) {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(
      `Accented: invalid argument. The options parameter must be an object if provided. It’s currently set to ${options}.`,
    );
  }
  if (options.throttle !== undefined) {
    if (typeof options.throttle !== 'object' || options.throttle === null) {
      throw new TypeError(
        `Accented: invalid argument. \`throttle\` option must be an object if provided. It’s currently set to ${options.throttle}.`,
      );
    }
    if (
      options.throttle.wait !== undefined &&
      (typeof options.throttle.wait !== 'number' || options.throttle.wait < 0)
    ) {
      throw new TypeError(
        `Accented: invalid argument. \`throttle.wait\` option must be a non-negative number if provided. It’s currently set to ${options.throttle.wait}.`,
      );
    }
  }
  if (options.output !== undefined) {
    if (typeof options.output !== 'object' || options.output === null) {
      throw new TypeError(
        `Accented: invalid argument. \`output\` option must be an object if provided. It’s currently set to ${options.output}.`,
      );
    }
    if (options.output.console !== undefined && typeof options.output.console !== 'boolean') {
      console.warn(
        `Accented: invalid argument. \`output.console\` option is expected to be a boolean. It’s currently set to ${options.output.console}.`,
      );
    }
    if (options.output.page !== undefined && typeof options.output.page !== 'boolean') {
      console.warn(
        `Accented: invalid argument. \`output.page\` option is expected to be a boolean. It’s currently set to ${options.output.page}.`,
      );
    }
  }
  if (options.callback !== undefined && typeof options.callback !== 'function') {
    throw new TypeError(
      `Accented: invalid argument. \`callback\` option must be a function if provided. It’s currently set to ${options.callback}.`,
    );
  }
  if (
    options.name !== undefined &&
    (typeof options.name !== 'string' || !options.name.match(nameRegex))
  ) {
    throw new TypeError(
      `Accented: invalid argument. \`name\` option must be a string that starts with a lowercase letter and only contains lowercase alphanumeric characters and dashes. It’s currently set to ${options.name}.`,
    );
  }
  if (options.axeOptions !== undefined) {
    if (typeof options.axeOptions !== 'object' || options.axeOptions === null) {
      throw new TypeError(
        `Accented: invalid argument. \`axeOptions\` option must be an object if provided. It’s currently set to ${options.axeOptions}.`,
      );
    }
    const unsupportedKeys = Object.keys(options.axeOptions).filter(
      (key) => !(allowedAxeOptions as unknown as Array<string>).includes(key),
    );
    if (unsupportedKeys.length > 0) {
      throw new TypeError(
        `Accented: invalid argument. \`axeOptions\` contains the following unsupported keys: ${unsupportedKeys.join(', ')}. Valid options are: ${allowedAxeOptions.join(', ')}.`,
      );
    }
  }
  if (options.context !== undefined) {
    validateContext(options.context);
  }
}
