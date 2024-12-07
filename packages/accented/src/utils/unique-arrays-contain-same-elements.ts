export default function uniqueArraysContainSameElements<T>(array1: Array<T>, array2: Array<T>) {
  const set1 = new Set(array1);
  const set2 = new Set(array2);
  return array1.every(item => set2.has(item)) &&
    array2.every(item => set1.has(item));
};
