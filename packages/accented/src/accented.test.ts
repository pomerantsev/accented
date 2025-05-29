import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import type { Mock } from 'node:test';

import accented from './accented.js';

suite('Accented', () => {
  test('runs without errors in NodeJS and issues a warning and a trace (it’s meant to be a no-op on the server side)', (t) => {
    t.mock.method(console, 'warn', () => {});
    t.mock.method(console, 'trace', () => {});
    accented();
    assert.equal((console.warn as Mock<() => void>).mock.callCount(), 1);
    assert.equal((console.trace as Mock<() => void>).mock.callCount(), 1);
  });

  suite('argument validation', () => {
    // @ts-expect-error
    assert.throws(() => accented({ throttle: null }));
    // @ts-expect-error
    assert.throws(() => accented({ throttle: 1000 }));

    assert.throws(() => accented({ throttle: { wait: -1 } }));
  });
});
