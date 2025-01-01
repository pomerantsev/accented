import assert from 'node:assert/strict';
import {suite, test, mock} from 'node:test';
import transformViolations from './transform-violations.js';

import type { AxeResults } from 'axe-core';
type Violation = AxeResults['violations'][number];
type Node = Violation['nodes'][number];

const commonProps1: Omit<Violation, 'nodes'> = {
  id: 'id1',
  help: 'help1',
  helpUrl: 'http://example.com',
  description: 'description1',
  tags: [],
  impact: 'serious'
};

// @ts-expect-error element is not HTMLElement
const element1: HTMLElement = {};
// @ts-expect-error element is not HTMLElement
const element2: HTMLElement = {};
// @ts-expect-error element is not HTMLElement
const element3: HTMLElement = {};

const node1: Node = {
  element: element1,
  html: '<div></div>',
  target: ['div'],
  any: [],
  all: [],
  none: [],
  failureSummary: 'summary1'
};

suite('transformViolations', () => {
  test('one violation, one element', () => {
    const violation: Violation = {
      ...commonProps1,
      nodes: [node1]
    };
    const elementsWithIssues = transformViolations([violation]);
    assert.equal(elementsWithIssues.length, 1);
    assert.equal(elementsWithIssues[0]?.element, element1);
    assert.equal(elementsWithIssues[0].issues.length, 1);
    assert.equal(elementsWithIssues[0].issues[0]?.id, 'id1');
    assert.equal(elementsWithIssues[0].issues[0]?.description, 'summary1');
  });
});
