import {suite, test} from 'node:test';
import assert from 'node:assert/strict';
import type { Signal } from '@preact/signals-core';
import { signal } from '@preact/signals-core';
import type { ExtendedElementWithIssues, Issue } from '../types';
import updateElementsWithIssues from './update-elements-with-issues';

import type { AxeResults, ImpactValue } from 'axe-core';
import type AccentedContainer from '../elements/accented-container';
type Violation = AxeResults['violations'][number];
type Node = Violation['nodes'][number];

const doc: Document = {
  // @ts-expect-error the return value is of incorrect type.
  createElement: () => ({})
}

// @ts-expect-error element is not HTMLElement
const element1: HTMLElement = {};
// @ts-expect-error element is not HTMLElement
const element2: HTMLElement = {};

const accentedContainer = doc.createElement('accented-container') as AccentedContainer;

const commonNodeProps = {
  html: '<div></div>',
  any: [],
  all: [],
  none: [],
  target: ['div']
};

const node1: Node = {
  ...commonNodeProps,
  element: element1,
};

const node2: Node = {
  ...commonNodeProps,
  element: element2,
};

const commonViolationProps = {
  help: 'help',
  helpUrl: 'http://example.com',
  description: 'description',
  tags: [],
  impact: 'serious' as ImpactValue
};

const violation1: Violation = {
  ...commonViolationProps,
  id: 'id1',
  nodes: [node1]
};

const violation2: Violation = {
  ...commonViolationProps,
  id: 'id2',
  nodes: [node2]
};

const violation3: Violation = {
  ...commonViolationProps,
  id: 'id3',
  nodes: [node2]
};

const commonIssueProps = {
  title: 'help',
  description: 'description',
  url: 'http://example.com',
  impact: 'serious'
} as const;

const issue1: Issue = {
  id: 'id1',
  ...commonIssueProps
};

const issue2: Issue = {
  id: 'id2',
  ...commonIssueProps
};

const issue3: Issue = {
  id: 'id3',
  ...commonIssueProps
};

suite('updateElementsWithIssues', () => {
  test('no changes', () => {
    const extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>> = signal([
      {
        id: 1,
        element: element1,
        accentedContainer,
        issues: signal([issue1])
      },
      {
        id: 2,
        element: element2,
        accentedContainer,
        issues: signal([issue2])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1, violation2], doc, 'accented');
    assert.equal(extendedElementsWithIssues.value.length, 2);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[1]?.element, element2);
    assert.equal(extendedElementsWithIssues.value[1]?.issues.value.length, 1);
  });

  test('one issue added', () => {
    const extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>> = signal([
      {
        id: 1,
        element: element1,
        accentedContainer,
        issues: signal([issue1])
      },
      {
        id: 2,
        element: element2,
        accentedContainer,
        issues: signal([issue2])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1, violation2, violation3], doc, 'accented');
    assert.equal(extendedElementsWithIssues.value.length, 2);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[1]?.element, element2);
    assert.equal(extendedElementsWithIssues.value[1]?.issues.value.length, 2);
  });

  test('one issue removed', () => {
    const extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>> = signal([
      {
        id: 1,
        element: element1,
        accentedContainer,
        issues: signal([issue1])
      },
      {
        id: 2,
        element: element2,
        accentedContainer,
        issues: signal([issue2, issue3])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1, violation2], doc, 'accented');
    assert.equal(extendedElementsWithIssues.value.length, 2);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[1]?.element, element2);
    assert.equal(extendedElementsWithIssues.value[1]?.issues.value.length, 1);
  });

  test('one element added', () => {
    const extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>> = signal([
      {
        id: 1,
        element: element1,
        accentedContainer,
        issues: signal([issue1])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1, violation2], doc, 'accented');
    assert.equal(extendedElementsWithIssues.value.length, 2);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[1]?.element, element2);
    assert.equal(extendedElementsWithIssues.value[1]?.issues.value.length, 1);
  });

  test('one element removed', () => {
    const extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>> = signal([
      {
        id: 1,
        element: element1,
        accentedContainer,
        issues: signal([issue1])
      },
      {
        id: 2,
        element: element2,
        accentedContainer,
        issues: signal([issue2])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1], doc, 'accented');
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
  });
});
