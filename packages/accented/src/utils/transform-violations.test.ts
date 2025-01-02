import assert from 'node:assert/strict';
import {suite, test, mock} from 'node:test';
import transformViolations from './transform-violations.js';

import type { AxeResults } from 'axe-core';
type Violation = AxeResults['violations'][number];
type Node = Violation['nodes'][number];

const commonViolationProps1: Omit<Violation, 'nodes'> = {
  id: 'id1',
  help: 'help1',
  helpUrl: 'http://example.com',
  description: 'description1',
  tags: [],
  impact: 'serious'
};

const commonViolationProps2: Omit<Violation, 'nodes'> = {
  id: 'id2',
  help: 'help2',
  helpUrl: 'http://example.com',
  description: 'description2',
  tags: [],
  impact: 'serious'
};

// @ts-expect-error element is not HTMLElement
const element1: HTMLElement = {};
// @ts-expect-error element is not HTMLElement
const element2: HTMLElement = {};
// @ts-expect-error element is not HTMLElement
const element3: HTMLElement = {};

const commonNodeProps = {
  html: '<div></div>',
  any: [],
  all: [],
  none: []
};

const node1: Node = {
  ...commonNodeProps,
  element: element1,
  target: ['div'],
  failureSummary: 'summary1'
};

const node2: Node = {
  ...commonNodeProps,
  element: element2,
  target: ['div'],
  failureSummary: 'summary2'
};

const node3: Node = {
  ...commonNodeProps,
  element: element3,
  target: ['div'],
  failureSummary: 'summary3'
};

suite('transformViolations', () => {
  test('one violation, one element', () => {
    const violation: Violation = {
      ...commonViolationProps1,
      nodes: [node1]
    };
    const elementsWithIssues = transformViolations([violation]);
    assert.equal(elementsWithIssues.length, 1);
    assert.equal(elementsWithIssues[0]?.element, element1);
    assert.equal(elementsWithIssues[0].issues.length, 1);
    assert.equal(elementsWithIssues[0].issues[0]?.id, 'id1');
    assert.equal(elementsWithIssues[0].issues[0]?.description, 'summary1');
  });

  test('two violations, two elements each', () => {
    const violation1: Violation = {
      ...commonViolationProps1,
      nodes: [node1, node2]
    };
    const violation2: Violation = {
      ...commonViolationProps2,
      nodes: [node1, node3]
    };
    const elementsWithIssues = transformViolations([violation1, violation2]);
    assert.equal(elementsWithIssues.length, 3);
    const elementWithTwoIssues = elementsWithIssues.find(elementWithIssues => elementWithIssues.element === element1);
    assert.equal(elementWithTwoIssues?.issues.length, 2);
  });

  test('a violation in an iframe', () => {
    const node: Node = {
      ...commonNodeProps,
      element: element1,
      // A target array whose length is > 1 signifies an element in an iframe
      target: ['iframe', 'div'],
      failureSummary: 'summary1'
    };
    const violation: Violation = {
      ...commonViolationProps1,
      nodes: [node]
    };

    const elementsWithIssues = transformViolations([violation]);
    assert.equal(elementsWithIssues.length, 0);
  });

  test('a violation in shadow DOM', () => {
    const node: Node = {
      ...commonNodeProps,
      element: element1,
      // A target that contains an array within the outer array signifies an element in shadow DOM
      target: [['div', 'div']],
      failureSummary: 'summary1'
    };
    const violation: Violation = {
      ...commonViolationProps1,
      nodes: [node]
    };

    const elementsWithIssues = transformViolations([violation]);
    assert.equal(elementsWithIssues.length, 0);
  });
});
