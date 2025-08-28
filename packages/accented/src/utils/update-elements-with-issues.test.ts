import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import type { Signal } from '@preact/signals-core';
import { signal } from '@preact/signals-core';
import type { AxeResults, ImpactValue } from 'axe-core';
import { JSDOM } from 'jsdom';
import type { AccentedTrigger } from '../elements/accented-trigger';
import type { ExtendedElementWithIssues, Issue } from '../types';
import { updateElementsWithIssues } from './update-elements-with-issues';

const dom = new JSDOM();
global.document = dom.window.document;
global.getComputedStyle = dom.window.getComputedStyle;
// JSDOM doesn't seem to have CSS, so we mock it
global.CSS = {
  supports: () => true,
} as any;
// Node already has a global `navigator` object,
// so we're mocking it differently than other globals.
Object.defineProperty(global, 'navigator', {
  value: { userAgent: dom.window.navigator.userAgent },
  writable: true,
  configurable: true,
});

type Violation = AxeResults['violations'][number];
type AxeNode = Violation['nodes'][number];

// Create real DOM elements using JSDOM
const element1 = document.createElement('div');
element1.setAttribute('id', 'element1');
document.body.appendChild(element1);

const element2 = document.createElement('div');
element2.setAttribute('id', 'element2');
document.body.appendChild(element2);

const element3 = document.createElement('div');
element3.setAttribute('id', 'element3');
// element3 is not connected (not added to document)

const rootNode = document;

const trigger = document.createElement('accented-trigger') as AccentedTrigger;

const position = signal({
  left: 0,
  width: 100,
  top: 0,
  height: 100,
});

const visible = signal(true);

const scrollableAncestors = signal(new Set<HTMLElement>());

const commonNodeProps = {
  html: '<div></div>',
  any: [],
  all: [],
  none: [],
  target: ['div'],
};

const node1: AxeNode = {
  ...commonNodeProps,
  element: element1,
};

const node2: AxeNode = {
  ...commonNodeProps,
  element: element2,
};

const node3: AxeNode = {
  ...commonNodeProps,
  element: element3,
};

const commonViolationProps = {
  help: 'help',
  helpUrl: 'http://example.com',
  description: 'description',
  tags: [],
  impact: 'serious' as ImpactValue,
};

const violation1: Violation = {
  ...commonViolationProps,
  id: 'id1',
  nodes: [node1],
};

const violation2: Violation = {
  ...commonViolationProps,
  id: 'id2',
  nodes: [node2],
};

const violation3: Violation = {
  ...commonViolationProps,
  id: 'id3',
  nodes: [node2],
};

const violation4: Violation = {
  ...commonViolationProps,
  id: 'id4',
  nodes: [node3],
};

const commonIssueProps = {
  title: 'help',
  description: 'description',
  url: 'http://example.com',
  impact: 'serious',
} as const;

const issue1: Issue = {
  id: 'id1',
  ...commonIssueProps,
};

const issue2: Issue = {
  id: 'id2',
  ...commonIssueProps,
};

const issue3: Issue = {
  id: 'id3',
  ...commonIssueProps,
};

const scanContext = {
  include: [document],
  exclude: [],
};

suite('updateElementsWithIssues', () => {
  test('no changes', () => {
    const extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>> = signal([
      {
        id: 1,
        element: element1,
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue1]),
      },
      {
        id: 2,
        element: element2,
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue2]),
      },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      scanContext,
      violations: [violation1, violation2],
      name: 'accented',
    });
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
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue1]),
      },
      {
        id: 2,
        element: element2,
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue2]),
      },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      scanContext,
      violations: [violation1, violation2, violation3],
      name: 'accented',
    });
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
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue1]),
      },
      {
        id: 2,
        element: element2,
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue2, issue3]),
      },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      scanContext,
      violations: [violation1, violation2],
      name: 'accented',
    });
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
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue1]),
      },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      scanContext,
      violations: [violation1, violation2],
      name: 'accented',
    });
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
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue1]),
      },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      scanContext,
      violations: [violation1, violation4],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
  });

  test('one element removed', () => {
    const extendedElementsWithIssues: Signal<Array<ExtendedElementWithIssues>> = signal([
      {
        id: 1,
        element: element1,
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue1]),
      },
      {
        id: 2,
        element: element2,
        rootNode,
        skipRender: false,
        position,
        visible,
        trigger,
        anchorNameValue: 'none',
        scrollableAncestors,
        issues: signal([issue2]),
      },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      scanContext,
      violations: [violation1],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
  });
});
