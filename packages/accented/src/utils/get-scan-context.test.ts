import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { getScanContext } from './get-scan-context';

suite('getScanContext', () => {
  test('when context doesn’t overlap with nodes, the result is empty', () => {
    const dom = new JSDOM('<div><div id="context"></div><div id="mutated-node"></div></div>');
    const { document } = dom.window;
    global.document = document;
    const mutatedNode = document.querySelector('#mutated-node')!;
    const scanContext = getScanContext([mutatedNode], '#context');

    assert.deepEqual(scanContext, {
      include: [],
      exclude: [],
    });
  });

  test('when context is within the mutated node, the result is the context', () => {
    const dom = new JSDOM('<div><div id="mutated-node"><div id="context"></div></div></div>');
    const { document } = dom.window;
    global.document = document;
    const mutatedNode = document.querySelector('#mutated-node')!;
    const scanContext = getScanContext([mutatedNode], '#context');
    const contextNode = document.querySelector('#context')!;

    assert.deepEqual(scanContext, {
      include: [contextNode],
      exclude: [],
    });
  });

  test('when mutated node is within context, the mutated node and the context nodes within it are correctly included / excluded', () => {
    const dom = new JSDOM(`<div>
      <div class="include" id="outer-include">
        <div id="mutated-node">
          <div class="exclude" id="inner-exclude">
            <div class="include" id="inner-include"></div>
          </div>
        </div>
      </div>
    </div>`);
    const { document } = dom.window;
    global.document = document;
    const mutatedNode = document.querySelector('#mutated-node')!;
    const scanContext = getScanContext([mutatedNode], {
      include: ['.include'],
      exclude: ['.exclude'],
    });
    const innerExclude = document.querySelector('#inner-exclude')!;
    const innerInclude = document.querySelector('#inner-include')!;

    assert.deepEqual(scanContext, {
      include: [mutatedNode, innerInclude],
      exclude: [innerExclude],
    });
  });

  test('when mutated node is within exclude, context elements within it are still included', () => {
    const dom = new JSDOM(`<div>
      <div class="exclude" id="outer-exclude">
        <div id="mutated-node">
          <div class="exclude" id="inner-exclude">
            <div class="include" id="inner-include"></div>
          </div>
        </div>
      </div>
    </div>`);
    const { document } = dom.window;
    global.document = document;
    const mutatedNode = document.querySelector('#mutated-node')!;
    const scanContext = getScanContext([mutatedNode], {
      include: ['.include'],
      exclude: ['.exclude'],
    });
    const innerExclude = document.querySelector('#inner-exclude')!;
    const innerInclude = document.querySelector('#inner-include')!;

    assert.deepEqual(scanContext, {
      include: [innerInclude],
      exclude: [innerExclude],
    });
  });
});
