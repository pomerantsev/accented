import assert from 'node:assert/strict';
import {suite, test} from 'node:test';
import uniqueArraysContainSameElements from './unique-arrays-contain-same-elements.js';

suite('uniqueArraysContainSameElements', () => {
  test('returns true when both arrays are empty', () => {
    assert.ok(uniqueArraysContainSameElements([], []));
  });
});
