import { isNode } from './dom-helpers.js';

// biome-ignore lint/suspicious/noExplicitAny: I'm not sure how to type this properly
type AnyObject = Record<string, any>;

const isObject = (obj: unknown): obj is AnyObject =>
  typeof obj === 'object' && obj !== null && !Array.isArray(obj);

export function deepMerge(target: AnyObject, source: AnyObject): AnyObject {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (isObject(source[key])) {
      // Don't merge DOM nodes.
      if (isObject(target[key]) && !isNode(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
