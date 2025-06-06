export function ensureNonEmpty<T>(arr: T[]): [T, ...T[]] {
  if (arr.length === 0) {
    throw new Error('Array must not be empty');
  }
  return arr as [T, ...T[]];
}
