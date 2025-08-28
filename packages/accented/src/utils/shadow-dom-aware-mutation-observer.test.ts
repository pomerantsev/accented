import assert from 'node:assert/strict';
import { beforeEach, suite, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createShadowDOMAwareMutationObserver } from './shadow-dom-aware-mutation-observer';

type MutationAssertion = {
  type: string;
  target?: Node;
  addedNodes?: { length: number; tagName?: string };
  removedNodes?: { length: number; tagName?: string };
};

const createTestDOM = (html = '<div id="container"></div>') => {
  const dom = new JSDOM(html);
  return { dom, document: dom.window.document };
};

const waitForMutation = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

const createElementWithShadowRoot = (document: Document, tagName = 'div') => {
  const element = document.createElement(tagName);
  const shadowRoot = element.attachShadow({ mode: 'open' });
  return { element, shadowRoot };
};

const assertMutationEquals = (mutation: MutationRecord, expected: MutationAssertion) => {
  assert.equal(mutation.type, expected.type);
  if (expected.target) {
    assert.equal(mutation.target, expected.target);
  }
  if (expected.addedNodes) {
    assert.equal(mutation.addedNodes.length, expected.addedNodes.length);
    if (expected.addedNodes.tagName) {
      assert.equal((mutation.addedNodes[0] as Element)?.tagName, expected.addedNodes.tagName);
    }
  }
  if (expected.removedNodes) {
    assert.equal(mutation.removedNodes.length, expected.removedNodes.length);
    if (expected.removedNodes.tagName) {
      assert.equal((mutation.removedNodes[0] as Element)?.tagName, expected.removedNodes.tagName);
    }
  }
};

const createAsyncMutationTest = (expectedMutations: number) => {
  let mutationCount = 0;
  let resolveTest: () => void;
  const testComplete = new Promise<void>((resolve) => {
    resolveTest = resolve;
  });

  const handleMutation =
    (callback: (mutations: MutationRecord[], count: number) => void) =>
    (mutations: MutationRecord[]) => {
      mutationCount++;
      callback(mutations, mutationCount);

      if (mutationCount === expectedMutations) {
        resolveTest();
      }
    };

  return { handleMutation, testComplete, getMutationCount: () => mutationCount };
};

suite('ShadowDOMAwareMutationObserver', () => {
  beforeEach(() => {
    const dom = new JSDOM();
    global.Node = dom.window.Node;
    global.MutationObserver = dom.window.MutationObserver;
  });

  suite('inserting elements', () => {
    test('fires when a node is inserted in an observed node', (_t, done) => {
      const { document } = createTestDOM();
      const container = document.querySelector('#container')!;

      const observer = createShadowDOMAwareMutationObserver('test', (mutations) => {
        assert.equal(mutations.length, 1);
        assertMutationEquals(mutations[0]!, {
          type: 'childList',
          addedNodes: { length: 1, tagName: 'DIV' },
        });

        done();
      });

      observer.observe(container, { childList: true });

      const newDiv = document.createElement('div');
      container.appendChild(newDiv);
    });

    test('fires when a node is inserted in a shadow root of an observed element', (_t, done) => {
      const { document } = createTestDOM('<div id="container"><div id="host"></div></div>');
      const container = document.querySelector('#container')!;
      const host = document.querySelector('#host')!;

      const shadowRoot = host.attachShadow({ mode: 'open' });

      const observer = createShadowDOMAwareMutationObserver('test', (mutations) => {
        assert.equal(mutations.length, 1);
        assertMutationEquals(mutations[0]!, {
          type: 'childList',
          addedNodes: { length: 1, tagName: 'DIV' },
        });

        done();
      });

      observer.observe(container, { childList: true });

      const newDiv = document.createElement('div');
      shadowRoot.appendChild(newDiv);
    });

    // This is an unfortunate limitation: we cannot be notified when a shadow root is created
    // in the observed DOM. When that happens, the whole shadow root subtree will stay unobserved.
    test('does not fire when a node is inserted in a shadow root created after observer starts', (_t, done) => {
      const { document } = createTestDOM('<div id="container"><div id="host"></div></div>');
      const container = document.querySelector('#container')!;
      const host = document.querySelector('#host')!;

      let callbackFired = false;
      const observer = createShadowDOMAwareMutationObserver('test', () => {
        callbackFired = true;
        done(new Error('Callback should not have fired'));
      });

      observer.observe(container, { childList: true, subtree: true });

      const shadowRoot = host.attachShadow({ mode: 'open' });
      const newDiv = document.createElement('div');
      shadowRoot.appendChild(newDiv);

      setTimeout(() => {
        assert.equal(
          callbackFired,
          false,
          'Callback should not have fired for shadow root created after observation',
        );
        done();
      }, 50);
    });

    test('discovers shadow roots when descendants with shadow roots are added', async () => {
      // This test verifies that when a wrapper element containing descendant shadow hosts
      // is added to the DOM, the shadow roots are properly discovered and observed
      const { document } = createTestDOM();
      const container = document.querySelector('#container')!;

      const { handleMutation, testComplete } = createAsyncMutationTest(2);

      const { element: hostElement, shadowRoot } = createElementWithShadowRoot(document);
      const wrapper = document.createElement('div');
      wrapper.appendChild(hostElement);

      const observer = createShadowDOMAwareMutationObserver(
        'test',
        handleMutation((mutations, count) => {
          assert.equal(mutations.length, 1);

          if (count === 1) {
            // First mutation: wrapper with descendant that has shadow root
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: container,
              addedNodes: { length: 1, tagName: 'DIV' },
            });
          } else if (count === 2) {
            // Second mutation: element added to the shadow root that was discovered
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: shadowRoot,
              addedNodes: { length: 1, tagName: 'SPAN' },
            });
          }
        }),
      );

      observer.observe(container, { childList: true, subtree: true });

      container.appendChild(wrapper);
      await waitForMutation();

      const shadowDiv = document.createElement('span');
      shadowRoot.appendChild(shadowDiv);

      await testComplete;
    });

    test('discovers shadow roots on directly added elements', async () => {
      // This test verifies that shadow roots are discovered on elements that are
      // added directly to the observed container (not just on descendants)
      const { document } = createTestDOM();
      const container = document.querySelector('#container')!;

      const { handleMutation, testComplete } = createAsyncMutationTest(2);
      const { element: hostElement, shadowRoot } = createElementWithShadowRoot(document);

      const observer = createShadowDOMAwareMutationObserver(
        'test',
        handleMutation((mutations, count) => {
          assert.equal(mutations.length, 1);

          if (count === 1) {
            // First mutation: element with shadow root added directly
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: container,
              addedNodes: { length: 1, tagName: 'DIV' },
            });
          } else if (count === 2) {
            // Second mutation: element added to the shadow root on the directly added element
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: shadowRoot,
              addedNodes: { length: 1, tagName: 'SPAN' },
            });
          }
        }),
      );

      observer.observe(container, { childList: true, subtree: true });

      // Add element with shadow root directly to container
      // This should now work with the bug fix (previously didn't work)
      container.appendChild(hostElement);
      await waitForMutation();

      const shadowDiv = document.createElement('span');
      shadowRoot.appendChild(shadowDiv);

      await testComplete;
    });

    test('discovers and observes nested shadow roots (two levels deep)', async () => {
      const { document } = createTestDOM();
      const container = document.querySelector('#container')!;

      const { handleMutation, testComplete } = createAsyncMutationTest(3);
      const { element: outerElement, shadowRoot: outerShadowRoot } =
        createElementWithShadowRoot(document);
      const { element: innerElement, shadowRoot: innerShadowRoot } = createElementWithShadowRoot(
        document,
        'span',
      );

      const observer = createShadowDOMAwareMutationObserver(
        'test',
        handleMutation((mutations, count) => {
          assert.equal(mutations.length, 1);

          if (count === 1) {
            // First mutation: outer element with shadow root added
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: container,
              addedNodes: { length: 1, tagName: 'DIV' },
            });
          } else if (count === 2) {
            // Second mutation: inner element with nested shadow root added to outer shadow root
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: outerShadowRoot,
              addedNodes: { length: 1, tagName: 'SPAN' },
            });
          } else if (count === 3) {
            // Third mutation: element added to nested (inner) shadow root
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: innerShadowRoot,
              addedNodes: { length: 1, tagName: 'P' },
            });
          }
        }),
      );

      observer.observe(container, { childList: true, subtree: true });

      container.appendChild(outerElement);
      await waitForMutation();

      outerShadowRoot.appendChild(innerElement);
      await waitForMutation();

      const deepElement = document.createElement('p');
      innerShadowRoot.appendChild(deepElement);

      await testComplete;
    });
  });

  suite('removing elements', () => {
    // Tests for proper cleanup when elements are removed from the DOM
    test('does not fire when elements are added to removed elements', async () => {
      const { document } = createTestDOM();
      const container = document.querySelector('#container')!;

      const { handleMutation, testComplete } = createAsyncMutationTest(2);
      let completionScheduled = false;

      const observer = createShadowDOMAwareMutationObserver(
        'test',
        handleMutation((mutations, count) => {
          assert.equal(mutations.length, 1);

          if (count === 1) {
            // First mutation: element added to container
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: container,
              addedNodes: { length: 1, tagName: 'DIV' },
            });
          } else if (count === 2) {
            // Second mutation: element removed from container
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: container,
              removedNodes: { length: 1, tagName: 'DIV' },
            });

            // Schedule completion check to ensure no third mutation occurs
            if (!completionScheduled) {
              completionScheduled = true;
            }
          } else {
            throw new Error(`Unexpected mutation count: ${count}`);
          }
        }),
      );

      observer.observe(container, { childList: true, subtree: true });

      const testElement = document.createElement('div');
      container.appendChild(testElement);
      await waitForMutation();

      container.removeChild(testElement);
      await waitForMutation();

      // Add element to the removed element (should NOT trigger mutation)
      const childElement = document.createElement('span');
      testElement.appendChild(childElement);

      await testComplete;
    });

    test('does not fire when elements are added to shadow roots of removed hosts', async () => {
      const { document } = createTestDOM();
      const container = document.querySelector('#container')!;

      const { handleMutation, testComplete } = createAsyncMutationTest(3);
      const { element: shadowHost, shadowRoot } = createElementWithShadowRoot(document);
      let completionScheduled = false;

      const observer = createShadowDOMAwareMutationObserver(
        'test',
        handleMutation((mutations, count) => {
          assert.equal(mutations.length, 1);

          if (count === 1) {
            // First mutation: shadow host added to container
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: container,
              addedNodes: { length: 1, tagName: 'DIV' },
            });
          } else if (count === 2) {
            // Second mutation: element added to shadow root
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: shadowRoot,
              addedNodes: { length: 1, tagName: 'SPAN' },
            });
          } else if (count === 3) {
            // Third mutation: shadow host removed from container
            assertMutationEquals(mutations[0]!, {
              type: 'childList',
              target: container,
              removedNodes: { length: 1, tagName: 'DIV' },
            });

            // Schedule completion check to ensure no fourth mutation occurs
            if (!completionScheduled) {
              completionScheduled = true;
            }
          } else {
            throw new Error(`Unexpected mutation count: ${count}`);
          }
        }),
      );

      observer.observe(container, { childList: true, subtree: true });

      container.appendChild(shadowHost);
      await waitForMutation();

      const shadowChild = document.createElement('span');
      shadowRoot.appendChild(shadowChild);
      await waitForMutation();

      container.removeChild(shadowHost);
      await waitForMutation();

      // Add another element to the shadow root of removed host (should NOT trigger mutation)
      const anotherShadowChild = document.createElement('p');
      shadowRoot.appendChild(anotherShadowChild);

      await testComplete;
    });
  });
});
