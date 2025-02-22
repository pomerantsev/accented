import assert from 'node:assert/strict';
import { suite, test } from 'node:test';

import deepMerge from './deep-merge';

suite('deepMerge', () => {
  test('merges two objects with overlapping keys', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);
    assert.deepEqual(result, { a: 1, b: 3, c: 4 });
  });

  test('deeply merges nested objects', () => {
    const target = { a: 1, b: { x: 1, y: 2 } };
    const source = { b: { y: 3, z: 4 }, c: 5 };
    const result = deepMerge(target, source);
    assert.deepEqual(result, { a: 1, b: { x: 1, y: 3, z: 4 }, c: 5 });
  });

  test('handles null values in a logical way', () => {
    const target = { a: 1 };
    const source = { a: null };
    const result = deepMerge(target, source);
    assert.deepEqual(result, { a: null });
  });

  test('doesn’t turn arrays into objects', () => {
    const target = { a: [1, 2, 3] };
    const source = { a: [4, 5] };
    const result = deepMerge(target, source);
    assert.deepEqual(result, { a: [4, 5] });
  });
});
