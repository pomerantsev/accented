// biome-ignore lint/suspicious/noExplicitAny: I'm not sure how to type this properly
type AnyObject = Record<string, any>;

const isObject = (obj: unknown): obj is AnyObject =>
  typeof obj === 'object' && obj !== null && !Array.isArray(obj);

export default function deepMerge(target: AnyObject, source: AnyObject): AnyObject {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (isObject(source[key])) {
      if (isObject(target[key])) {
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
