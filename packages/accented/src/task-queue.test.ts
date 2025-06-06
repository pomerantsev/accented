import assert from 'node:assert/strict';
import { mock, suite, test } from 'node:test';

import { TaskQueue } from './task-queue';

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

const createAsyncCallback = (duration: number) =>
  mock.fn(() => new Promise((resolve) => setTimeout(resolve, duration)));

suite('TaskQueue', () => {
  test('callback is not called after a TaskQueue is created, even after a timeout', async () => {
    const asyncCallback = createAsyncCallback(0);
    new TaskQueue(asyncCallback, { wait: 50, leading: true });
    await wait(100);
    assert.equal(asyncCallback.mock.callCount(), 0);
  });

  test('callback is not called if addMultiple is called with an empty array', async () => {
    const asyncCallback = createAsyncCallback(0);
    const taskQueue = new TaskQueue(asyncCallback, { wait: 50, leading: true });
    taskQueue.addMultiple([]);
    await wait(100);
    assert.equal(asyncCallback.mock.callCount(), 0);
  });

  test('callback is called once if multiple items are added before the first delay has elapsed', async () => {
    const asyncCallback = createAsyncCallback(0);
    const taskQueue = new TaskQueue<string>(asyncCallback, { wait: 100, leading: false });
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

  test('callback is called according to expected schedule', async () => {
    const asyncCallback = createAsyncCallback(100);
    const taskQueue = new TaskQueue<string>(asyncCallback, { wait: 100, leading: false });

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

  test('callback is called according to expected schedule when second task is added before the first callback completes', async () => {
    const asyncCallback = createAsyncCallback(100);
    const taskQueue = new TaskQueue<string>(asyncCallback, { wait: 100, leading: false });

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

    await wait(100);

    // 250 ms: Third measurement, callback still called only once
    assert.equal(asyncCallback.mock.callCount(), 1);

    // 300 ms: Callback called for the second time

    await wait(100);

    // 350 ms: Fourth measurement, callback called twice
    assert.equal(asyncCallback.mock.callCount(), 2);
  });

  test('callback is called according to expected schedule with leading: true', async () => {
    const asyncCallback = createAsyncCallback(100);
    const taskQueue = new TaskQueue<string>(asyncCallback, { wait: 100, leading: true });

    // 0 ms: Add "one"
    taskQueue.add('one');

    await wait(50);

    // 50 ms: Add "two"
    taskQueue.add('two');

    // 50 ms: First measurement, callback called
    assert.equal(asyncCallback.mock.callCount(), 1);

    // 100 ms: First callback completes

    await wait(100);

    // 150 ms: Second measurement, callback still called once
    assert.equal(asyncCallback.mock.callCount(), 1);

    await wait(100);

    // 250 ms: Third measurement, callback called twice
    assert.equal(asyncCallback.mock.callCount(), 2);
  });
});
