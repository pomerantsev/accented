import assert from 'node:assert/strict';
import {suite, test} from 'node:test';
import areSetsEqual from './are-elements-with-issues-equal.js';

suite('areSetsEqual', () => {
  test('returns true when both sets are empty', () => {
    assert.ok(areSetsEqual(new Set(), new Set()));
  });

  test('returns true when sets have the same elements, even when order in the original arrays doesn’t match', () => {
    const set1 = new Set(['one', 'two']);
    const set2 = new Set(['two', 'one']);
    assert.ok(areSetsEqual(set1, set2));
  });

  test('returns false when sets have different length', () => {
    const set1 = new Set(['one']);
    const set2 = new Set(['two', 'one']);
    assert.equal(areSetsEqual(set1, set2), false);
  });

  test('returns false when sets have the same length, but one element differs', () => {
    const set1 = new Set(['one', 'two']);
    const set2 = new Set(['one', 'three']);
    assert.equal(areSetsEqual(set1, set2), false);
  });
});
