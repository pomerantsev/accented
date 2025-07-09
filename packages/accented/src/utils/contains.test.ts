import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { contains } from './contains';

suite('contains', () => {
  test('an element contains itself', () => {
    const dom = new JSDOM('<div id="test"></div>');
    const { document } = dom.window;
    const element = document.querySelector('#test')!;

    assert.equal(contains(element, element), true);
  });

  test('an element does not contain its sibling', () => {
    const dom = new JSDOM('<div><div id="sibling1"></div><div id="sibling2"></div></div>');
    const { document } = dom.window;
    const sibling1 = document.querySelector('#sibling1')!;
    const sibling2 = document.querySelector('#sibling2')!;

    assert.equal(contains(sibling1, sibling2), false);
  });

  test('an element contain its descendant', () => {
    const dom = new JSDOM('<div id="ancestor"><div id="descendant"></div></div>');
    const { document } = dom.window;
    const ancestor = document.querySelector('#ancestor')!;
    const descendant = document.querySelector('#descendant')!;

    assert.equal(contains(ancestor, descendant), true);
  });

  test('an element contain its descendant', () => {
    const dom = new JSDOM('<div id="ancestor"><div id="descendant"></div></div>');
    const { document } = dom.window;
    const ancestor = document.querySelector('#ancestor')!;
    const descendant = document.querySelector('#descendant')!;

    assert.equal(contains(descendant, ancestor), false);
  });

  test('an element contain its descendant if the descendant is in a shadow DOM', () => {
    const dom = new JSDOM('<div id="ancestor"><div id="host"></div></div>');
    global.Node = dom.window.Node;
    const { document } = dom.window;
    const ancestor = document.querySelector('#ancestor')!;
    const host = document.querySelector('#host')!;
    const shadowRoot = host.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = '<div id="descendant"></div>';
    const descendant = shadowRoot.querySelector('#descendant')!;

    assert.equal(contains(ancestor, descendant), true);
  });
});
