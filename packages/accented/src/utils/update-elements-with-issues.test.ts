import {suite, test} from 'node:test';
import assert from 'node:assert/strict';
import type { Signal } from '@preact/signals-core';
import { signal } from '@preact/signals-core';
import type { ExtendedElementWithIssues, Issue } from '../types';
import updateElementsWithIssues from './update-elements-with-issues';

import type { AxeResults, ImpactValue } from 'axe-core';
import type { AccentedTrigger } from '../elements/accented-trigger';
type Violation = AxeResults['violations'][number];
type Node = Violation['nodes'][number];

const win: Window & { CSS: typeof CSS } = {
  document: {
    // @ts-expect-error the return value is of incorrect type.
    createElement: () => ({
      style: {
        setProperty: () => {}
      },
      dataset: {}
    })
  },
  // @ts-expect-error we're missing a lot of properties
  getComputedStyle: () => ({
    zIndex: '',
    direction: 'ltr'
  }),
  // @ts-expect-error we're missing a lot of properties
  CSS: {
    supports: () => true
  }
}

const getBoundingClientRect = () => ({});

// @ts-expect-error element is not HTMLElement
const element1: HTMLElement = {getBoundingClientRect, isConnected: true};
// @ts-expect-error element is not HTMLElement
const element2: HTMLElement = {getBoundingClientRect, isConnected: true};
// @ts-expect-error element is not HTMLElement
const element3: HTMLElement = {getBoundingClientRect, isConnected: false};

const trigger = win.document.createElement('accented-trigger') as AccentedTrigger;

const position = signal({
  left: 0,
  width: 100,
  top: 0,
  height: 100
});

const visible = signal(true);

const scrollableAncestors = signal(new Set<HTMLElement>());

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

const node3: Node = {
  ...commonNodeProps,
  element: element3,
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

const violation4: Violation = {
  ...commonViolationProps,
  id: 'id4',
  nodes: [node3]
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
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue1])
      },
      {
        id: 2,
        element: element2,
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue2])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1, violation2], win, 'accented');
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
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue1])
      },
      {
        id: 2,
        element: element2,
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue2])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1, violation2, violation3], win, 'accented');
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
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue1])
      },
      {
        id: 2,
        element: element2,
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue2, issue3])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1, violation2], win, 'accented');
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
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue1])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1, violation2], win, 'accented');
    assert.equal(extendedElementsWithIssues.value.length, 2);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[1]?.element, element2);
    assert.equal(extendedElementsWithIssues.value[1]?.issues.value.length, 1);
  });

  test('one disconnected element added', () => {
    const extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>> = signal([
      {
        id: 1,
        element: element1,
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue1])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1, violation4], win, 'accented');
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
  });

  test('one element removed', () => {
    const extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>> = signal([
      {
        id: 1,
        element: element1,
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue1])
      },
      {
        id: 2,
        element: element2,
        position,
        visible,
        trigger,
        scrollableAncestors,
        issues: signal([issue2])
      }
    ]);
    updateElementsWithIssues(extendedElementsWithIssues, [violation1], win, 'accented');
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
  });
});
