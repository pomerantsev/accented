import assert from 'node:assert/strict';
import {mock, suite, test} from 'node:test';

import TaskQueue from './task-queue';

const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration));

const createAsyncCallback = (duration: number) => mock.fn(() => new Promise(resolve => setTimeout(() => { console.log('Async callback done'); resolve(null); }, duration)));

suite('TaskQueue', () => {
  test('callback is not called after a TaskQueue is created, even after a timeout', async () => {
    const asyncCallback = createAsyncCallback(0);
    new TaskQueue(asyncCallback);
    await wait(100);
    assert.equal(asyncCallback.mock.callCount(), 0);
  });

  test('callback is called once if one item is added to the queue', async () => {
    const asyncCallback = createAsyncCallback(0);
    const taskQueue = new TaskQueue<string>(asyncCallback);
    taskQueue.add('one');
    await wait(100);
    assert.equal(asyncCallback.mock.callCount(), 1);
  });

  test('callback is called once if two items are added one after the other', async () => {
    const asyncCallback = createAsyncCallback(0);
    const taskQueue = new TaskQueue<string>(asyncCallback);
    taskQueue.add('one');
    taskQueue.add('two');
    await wait(100);
    assert.equal(asyncCallback.mock.callCount(), 1);
  });

  test('callback is called twice if the second item is added while the first callback is running', async () => {
    const asyncCallback = createAsyncCallback(100);
    const taskQueue = new TaskQueue<string>(asyncCallback);
    taskQueue.add('one');
    await wait(50);
    taskQueue.add('two');
    await wait(200);
    assert.equal(asyncCallback.mock.callCount(), 2);
  });
});
