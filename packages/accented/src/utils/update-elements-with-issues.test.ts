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

const fullDocumentContext = {
  include: [document],
  exclude: [],
};

function createElementsWithIssues(
  items: Array<{ id: number; element: HTMLElement; issues: Array<Issue> }>,
): Signal<Array<ExtendedElementWithIssues>> {
  return signal(
    items.map(({ id, element, issues }) => ({
      id,
      element,
      rootNode,
      skipRender: false,
      position,
      visible,
      trigger,
      anchorNameValue: 'none',
      scrollableAncestors,
      issues: signal(issues),
    })),
  );
}

suite('updateElementsWithIssues', () => {
  test('no changes', () => {
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: element1, issues: [issue1] },
      { id: 2, element: element2, issues: [issue2] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: fullDocumentContext,
      limitedContextViolations: [violation1, violation2],
      fullContextViolations: [],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 2);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[1]?.element, element2);
    assert.equal(extendedElementsWithIssues.value[1]?.issues.value.length, 1);
  });

  test('one issue added', () => {
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: element1, issues: [issue1] },
      { id: 2, element: element2, issues: [issue2] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: fullDocumentContext,
      limitedContextViolations: [violation1, violation2, violation3],
      fullContextViolations: [],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 2);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[1]?.element, element2);
    assert.equal(extendedElementsWithIssues.value[1]?.issues.value.length, 2);
  });

  test('one issue removed', () => {
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: element1, issues: [issue1] },
      { id: 2, element: element2, issues: [issue2, issue3] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: fullDocumentContext,
      limitedContextViolations: [violation1, violation2],
      fullContextViolations: [],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 2);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[1]?.element, element2);
    assert.equal(extendedElementsWithIssues.value[1]?.issues.value.length, 1);
  });

  test('one element added', () => {
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: element1, issues: [issue1] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: fullDocumentContext,
      limitedContextViolations: [violation1, violation2],
      fullContextViolations: [],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 2);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[1]?.element, element2);
    assert.equal(extendedElementsWithIssues.value[1]?.issues.value.length, 1);
  });

  test('one disconnected element added', () => {
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: element1, issues: [issue1] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: fullDocumentContext,
      limitedContextViolations: [violation1, violation4],
      fullContextViolations: [],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
  });

  test('one element removed', () => {
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: element1, issues: [issue1] },
      { id: 2, element: element2, issues: [issue2] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: fullDocumentContext,
      limitedContextViolations: [violation1],
      fullContextViolations: [],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, element1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
  });

  test('strips descendant-dependent issue from element outside limited context when full context no longer reports it', () => {
    const headingIssue: Issue = {
      id: 'page-has-heading-one',
      ...commonIssueProps,
    };
    const narrowContext = {
      include: [element1],
      exclude: [],
    };
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: document.documentElement, issues: [headingIssue] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: narrowContext,
      limitedContextViolations: [],
      fullContextViolations: [],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 0);
  });

  test('keeps descendant-dependent issue on element outside limited context when full context still reports it', () => {
    const headingIssue: Issue = {
      id: 'page-has-heading-one',
      ...commonIssueProps,
    };
    const htmlNode: AxeNode = {
      ...commonNodeProps,
      element: document.documentElement,
    };
    const headingViolation: Violation = {
      ...commonViolationProps,
      id: 'page-has-heading-one',
      nodes: [htmlNode],
    };
    const narrowContext = {
      include: [element1],
      exclude: [],
    };
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: document.documentElement, issues: [headingIssue] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: narrowContext,
      limitedContextViolations: [],
      fullContextViolations: [headingViolation],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, document.documentElement);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value[0]?.id, 'page-has-heading-one');
  });

  test('keeps non-descendant-dependent issue on element outside limited context', () => {
    const langIssue: Issue = {
      id: 'html-has-lang',
      ...commonIssueProps,
    };
    const narrowContext = {
      include: [element1],
      exclude: [],
    };
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: document.documentElement, issues: [langIssue] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: narrowContext,
      limitedContextViolations: [],
      fullContextViolations: [],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, document.documentElement);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value[0]?.id, 'html-has-lang');
  });

  test('adds a new element reported only by full context violations', () => {
    const htmlNode: AxeNode = {
      ...commonNodeProps,
      element: document.documentElement,
    };
    const headingViolation: Violation = {
      ...commonViolationProps,
      id: 'page-has-heading-one',
      nodes: [htmlNode],
    };
    const narrowContext = {
      include: [element1],
      exclude: [],
    };
    const extendedElementsWithIssues = createElementsWithIssues([]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: narrowContext,
      limitedContextViolations: [],
      fullContextViolations: [headingViolation],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, document.documentElement);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.issues.value[0]?.id, 'page-has-heading-one');
  });

  test('adds a new element with merged issues from limited and full context violations', () => {
    const htmlNode: AxeNode = {
      ...commonNodeProps,
      element: document.documentElement,
    };
    const langViolation: Violation = {
      ...commonViolationProps,
      id: 'html-has-lang',
      nodes: [htmlNode],
    };
    const headingViolation: Violation = {
      ...commonViolationProps,
      id: 'page-has-heading-one',
      nodes: [htmlNode],
    };
    const extendedElementsWithIssues = createElementsWithIssues([]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: fullDocumentContext,
      limitedContextViolations: [langViolation],
      fullContextViolations: [headingViolation],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, document.documentElement);
    assert.deepEqual(
      extendedElementsWithIssues.value[0]?.issues.value.map((issue) => issue.id),
      ['html-has-lang', 'page-has-heading-one'],
    );
  });

  test('merges limited and full context violations onto an existing element', () => {
    const langIssue: Issue = {
      id: 'html-has-lang',
      ...commonIssueProps,
    };
    const htmlNode: AxeNode = {
      ...commonNodeProps,
      element: document.documentElement,
    };
    const langViolation: Violation = {
      ...commonViolationProps,
      id: 'html-has-lang',
      nodes: [htmlNode],
    };
    const headingViolation: Violation = {
      ...commonViolationProps,
      id: 'page-has-heading-one',
      nodes: [htmlNode],
    };
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: document.documentElement, issues: [langIssue] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: fullDocumentContext,
      limitedContextViolations: [langViolation],
      fullContextViolations: [headingViolation],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, document.documentElement);
    assert.deepEqual(
      extendedElementsWithIssues.value[0]?.issues.value.map((issue) => issue.id),
      ['html-has-lang', 'page-has-heading-one'],
    );
  });

  test('strips only descendant-dependent issues from an element outside limited context with mixed issues', () => {
    const langIssue: Issue = {
      id: 'html-has-lang',
      ...commonIssueProps,
    };
    const headingIssue: Issue = {
      id: 'page-has-heading-one',
      ...commonIssueProps,
    };
    const narrowContext = {
      include: [element1],
      exclude: [],
    };
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: document.documentElement, issues: [langIssue, headingIssue] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: narrowContext,
      limitedContextViolations: [],
      fullContextViolations: [],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, document.documentElement);
    assert.deepEqual(
      extendedElementsWithIssues.value[0]?.issues.value.map((issue) => issue.id),
      ['html-has-lang'],
    );
  });

  test('keeps existing issue on element outside limited context and adds a new full context issue', () => {
    const langIssue: Issue = {
      id: 'html-has-lang',
      ...commonIssueProps,
    };
    const htmlNode: AxeNode = {
      ...commonNodeProps,
      element: document.documentElement,
    };
    const headingViolation: Violation = {
      ...commonViolationProps,
      id: 'page-has-heading-one',
      nodes: [htmlNode],
    };
    const narrowContext = {
      include: [element1],
      exclude: [],
    };
    const extendedElementsWithIssues = createElementsWithIssues([
      { id: 1, element: document.documentElement, issues: [langIssue] },
    ]);
    updateElementsWithIssues({
      extendedElementsWithIssues,
      limitedContext: narrowContext,
      limitedContextViolations: [],
      fullContextViolations: [headingViolation],
      name: 'accented',
    });
    assert.equal(extendedElementsWithIssues.value.length, 1);
    assert.equal(extendedElementsWithIssues.value[0]?.element, document.documentElement);
    assert.deepEqual(
      extendedElementsWithIssues.value[0]?.issues.value.map((issue) => issue.id),
      ['html-has-lang', 'page-has-heading-one'],
    );
  });
});
