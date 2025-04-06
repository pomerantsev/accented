import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import normalizeContext from './normalize-context';

suite('normalizeContext', () => {
  test('when document is passed, only document is returned in include', () => {
    const dom = new JSDOM('<div id="test"></div>');
    const { document } = dom.window;
    const normalizedContext = normalizeContext(document);

    assert.deepEqual(normalizedContext, {
      include: [document],
      exclude: []
    });
  });

  test('when an element is passed, only that element is returned in include', () => {
    const dom = new JSDOM('<div id="test"></div>');
    const { document } = dom.window;
    const element = document.querySelector('#test')!;
    const normalizedContext = normalizeContext(element);

    assert.deepEqual(normalizedContext, {
      include: [element],
      exclude: []
    });
  });

  test('when a selector is passed and elements matching that selector exist, all those elements are included', () => {
    const dom = new JSDOM(`<div>
      <div class="matches"></div>
      <div class="matches"></div>
      <div class="doesnt-match"></div>
    </div>`);
    const { document } = dom.window;
    global.document = document;
    const matchingElements = Array.from(document.querySelectorAll('.matches'));
    const normalizedContext = normalizeContext('.matches');

    assert.equal(matchingElements.length, 2);
    assert.deepEqual(normalizedContext, {
      include: matchingElements,
      exclude: []
    });
  });

  test('when a selector is passed and no elements matching that selector exist, `include` is empty', () => {
    const dom = new JSDOM(`<div>
      <div class="doesnt-match"></div>
      <div class="doesnt-match"></div>
      <div class="doesnt-match"></div>
    </div>`);
    const { document } = dom.window;
    global.document = document;
    const normalizedContext = normalizeContext('.matches');

    assert.deepEqual(normalizedContext, {
      include: [],
      exclude: []
    });
  });

  test('when a node list is passed, all the nodes from the list are included', () => {
    const dom = new JSDOM(`<div>
      <div class="matches"></div>
      <div class="matches"></div>
      <div class="doesnt-match"></div>
    </div>`);
    const { document } = dom.window;
    const matchingElements = document.querySelectorAll('.matches');
    const normalizedContext = normalizeContext(matchingElements);

    assert.equal(matchingElements.length, 2);
    assert.deepEqual(normalizedContext, {
      include: Array.from(matchingElements),
      exclude: []
    });
  });

  test('when an object with `fromShadowDom` is passed, all the matching nodes are included', () => {
    const dom = new JSDOM(`<div>
      <div class="host"></div>
      <div class="host"></div>
    </div>`);
    const { document } = dom.window;
    global.document = document;
    const hosts = document.querySelectorAll('.host');
    const matchingElements = [];
    for (const host of hosts) {
      const shadowRoot = host.attachShadow({ mode: 'open' });
      const matchingElement = document.createElement('div');
      matchingElement.classList.add('matches');
      shadowRoot.appendChild(matchingElement);
      matchingElements.push(matchingElement);
    }
    const normalizedContext = normalizeContext({fromShadowDom: ['.host', '.matches']});

    assert.equal(matchingElements.length, 2);
    assert.deepEqual(normalizedContext, {
      include: matchingElements,
      exclude: []
    });
  });
});
