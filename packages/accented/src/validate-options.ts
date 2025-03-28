import type { Selector, SelectorList, ContextProp, ContextObject, AccentedOptions, AxeContext } from './types';
import { allowedAxeOptions } from './types.js';
import { isNode, isNodeList } from './utils/dom-helpers.js';

function isSelector(axeContextFragment: AxeContext): axeContextFragment is Selector {
  return typeof axeContextFragment === 'string'
    || isNode(axeContextFragment)
    || 'fromShadowDom' in axeContextFragment;
}

function validateSelector(selector: Selector) {
  if (typeof selector === 'string') {
    return;
  } else if (isNode(selector)) {
    return;
  } else if ('fromShadowDom' in selector) {
    if (!Array.isArray(selector.fromShadowDom)
      || selector.fromShadowDom.length < 2 ||
      !selector.fromShadowDom.every(item => typeof item === 'string')
    ) {
      throw new TypeError('TODO');
    }
    return;
  } else {
    const neverSelector: never = selector;
    throw new TypeError(`TODO`);
  }
}

function isSelectorList(axeContextFragment: AxeContext): axeContextFragment is SelectorList {
  return (typeof axeContextFragment === 'object' && isNodeList(axeContextFragment))
    || (Array.isArray(axeContextFragment) && axeContextFragment.every(item => isSelector(item)));
}

function validateSelectorList(selectorList: SelectorList) {
  if (isNodeList(selectorList)) {
    return;
  } else if (Array.isArray(selectorList)) {
    for (const selector of selectorList) {
      validateSelector(selector);
    }
  } else {
    const neverSelectorList: never = selectorList;
    throw new TypeError(`TODO`);
  }
}

function isContextProp(axeContextFragment: AxeContext): axeContextFragment is ContextProp {
  return isSelector(axeContextFragment) || isSelectorList(axeContextFragment);
}

function validateContextProp(axeContext: Selector | SelectorList) {
  if (isSelector(axeContext)) {
    validateSelector(axeContext);
  } else if (isSelectorList(axeContext)) {
    validateSelectorList(axeContext);
  } else {
    const neverAxeContext: never = axeContext;
    throw new TypeError(`TODO`);
  }
}

function isContextObject(axeContextFragment: AxeContext): axeContextFragment is ContextObject {
  return typeof axeContextFragment === 'object' && axeContextFragment !== null
    && ('include' in axeContextFragment || 'exclude' in axeContextFragment);
}

function validateContextObject(contextObject: ContextObject) {
  if ('include' in contextObject) {
    validateContextProp(contextObject.include!);
  }
  if ('exclude' in contextObject) {
    validateContextProp(contextObject.exclude!);
  }
}

function validateAxeContext(axeContext: AxeContext) {
  if (isContextProp(axeContext)) {
    validateContextProp(axeContext);
  } else if (isContextObject(axeContext)) {
    validateContextObject(axeContext);
  } else {
    const neverAxeContext: never = axeContext;
    throw new TypeError(`TODO`);
  }
}

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
  if (options.axeContext !== undefined) {
    validateAxeContext(options.axeContext);
  }
}
