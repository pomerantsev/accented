import assert from 'node:assert/strict';
import {mock, suite, test} from 'node:test';

import TaskQueue from './task-queue.js';

const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration));

const createAsyncCallback = (duration: number) => mock.fn(() => new Promise(resolve => setTimeout(resolve, duration)));

suite('TaskQueue', () => {
  test('callback is not called after a TaskQueue is created, even after a timeout', async () => {
    const asyncCallback = createAsyncCallback(0);
    new TaskQueue(asyncCallback);
    await wait(100);
    assert.equal(asyncCallback.mock.callCount(), 0);
  });

  test('callback is called once if multiple items are added before the initial delay has elapsed', async () => {
    const asyncCallback = createAsyncCallback(0);
    const taskQueue = new TaskQueue<string>(asyncCallback, {initialDelay: 100});
    taskQueue.add('one');
    // Adding the second item synchronously
    taskQueue.add('two');
    await wait(50);
    // Adding the third item asynchronously
    taskQueue.add('three');
    assert.equal(asyncCallback.mock.callCount(), 0);
    await wait(100);
    assert.equal(asyncCallback.mock.callCount(), 1);
  });

  test('callback is called according to expected schedule without throttling', async () => {
    const asyncCallback = createAsyncCallback(100);
    const taskQueue = new TaskQueue<string>(asyncCallback, {initialDelay: 100, throttleDelay: 200});

    // 0 ms: Add "one"
    taskQueue.add('one');

    await wait(50);

    // 50 ms: First measurement, callback not called
    assert.equal(asyncCallback.mock.callCount(), 0);

    // 100 ms: Callback called for the first time
    // 200 ms: First callback completes

    await wait(200);

    // 250 ms: Second measurement, callback called once
    assert.equal(asyncCallback.mock.callCount(), 1);

    // 250 ms: Add "two"
    taskQueue.add('two');

    // 350 ms: Callback called for the second time

    await wait(150);

    // 400 ms: Third measurement, callback called twice
    assert.equal(asyncCallback.mock.callCount(), 2);
  });

  test('callback is called according to expected schedule with throttling', async () => {
    const asyncCallback = createAsyncCallback(100);
    const taskQueue = new TaskQueue<string>(asyncCallback, {initialDelay: 100, throttleDelay: 200});

    // 0 ms: Add "one"
    taskQueue.add('one');

    await wait(50);

    // 50 ms: First measurement, callback not called
    assert.equal(asyncCallback.mock.callCount(), 0);

    // 100 ms: Callback called for the first time

    await wait(100);

    // 150 ms: Second measurement, callback called once
    assert.equal(asyncCallback.mock.callCount(), 1);

    // 150 ms: Add "two"
    taskQueue.add('two');

    // 200 ms: First callback completes

    await wait(150);

    // 300 ms: Third measurement, callback still called only once
    assert.equal(asyncCallback.mock.callCount(), 1);

    // 400 ms: Callback called for the second time

    await wait(150);

    // 450 ms: Fourth measurement, callback called twice
    assert.equal(asyncCallback.mock.callCount(), 2);
  });
});
