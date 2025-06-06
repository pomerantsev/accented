import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import type { Issue } from '../types';
import { areIssueSetsEqual } from './are-issue-sets-equal';

const issue1: Issue = {
  id: 'id1',
  title: 'title1',
  description: 'description1',
  url: 'http://example.com',
  impact: 'serious',
};

const issue2: Issue = {
  id: 'id2',
  title: 'title2',
  description: 'description2',
  url: 'http://example.com',
  impact: 'serious',
};

// @ts-expect-error
const issue2Clone: Issue = Object.keys(issue2).reduce((obj, key) => {
  // @ts-expect-error
  obj[key] = issue2[key];
  return obj;
}, {});

const issue3: Issue = {
  id: 'id3',
  title: 'title3',
  description: 'description3',
  url: 'http://example.com',
  impact: 'serious',
};

suite('areIssueSetsEqual', () => {
  test('returns true when both sets are empty', () => {
    assert.ok(areIssueSetsEqual([], []));
  });

  test('returns true when both sets have equal elements, even when the order in the arrays doesn’t match', () => {
    assert.ok(areIssueSetsEqual([issue1, issue2], [issue2Clone, issue1]));
  });

  test('returns false when sets have different length', () => {
    assert.equal(areIssueSetsEqual([issue1, issue2], [issue1]), false);
  });

  test('returns false when sets have the same length, but one element differs', () => {
    assert.equal(areIssueSetsEqual([issue1, issue2], [issue1, issue3]), false);
  });
});
