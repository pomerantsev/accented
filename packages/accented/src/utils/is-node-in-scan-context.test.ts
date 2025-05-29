import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import { JSDOM } from 'jsdom';
import isNodeInScanContext from './is-node-in-scan-context';

suite('isNodeInScanContext', () => {
  test('doesn’t include an element if scan context is empty', () => {
    const dom = new JSDOM('<div id="test"></div>');
    const { document } = dom.window;
    const node = document.querySelector('#test')!;

    const scanContext = { include: [], exclude: [] };

    assert.equal(isNodeInScanContext(node, scanContext), false);
  });

  test('includes an element whose ancestor is included', () => {
    const dom = new JSDOM('<div id="test"></div>');
    const { document } = dom.window;
    const node = document.querySelector('#test')!;
    const body = document.body;

    const scanContext = { include: [body], exclude: [] };

    assert.ok(isNodeInScanContext(node, scanContext));
  });

  test('does not include an element whose closest ancestor is excluded', () => {
    const dom = new JSDOM('<div id="excluded"><div id="test"></div></div>');
    const { document } = dom.window;
    const node = document.querySelector('#test')!;
    const body = document.body;
    const excludedAncestor = document.querySelector('#excluded')!;

    const scanContext = { include: [body], exclude: [excludedAncestor] };

    assert.equal(isNodeInScanContext(node, scanContext), false);
  });

  test('includes an element if it itself is included', () => {
    const dom = new JSDOM('<div id="test"></div>');
    const { document } = dom.window;
    const node = document.querySelector('#test')!;

    const scanContext = { include: [node], exclude: [] };

    assert.ok(isNodeInScanContext(node, scanContext));
  });

  test('doesn’t include an element if it itself is excluded', () => {
    const dom = new JSDOM('<div id="test"></div>');
    const { document } = dom.window;
    const node = document.querySelector('#test')!;
    const body = document.body;

    const scanContext = { include: [body], exclude: [node] };

    assert.equal(isNodeInScanContext(node, scanContext), false);
  });

  test('includes an element if it’s both included and excluded (include takes precedence)', () => {
    const dom = new JSDOM('<div id="test"></div>');
    const { document } = dom.window;
    const node = document.querySelector('#test')!;

    const scanContext = { include: [node], exclude: [node] };

    assert.ok(isNodeInScanContext(node, scanContext));
  });
});
