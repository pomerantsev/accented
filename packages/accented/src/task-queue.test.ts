import assert from 'node:assert/strict';
import {afterEach, beforeEach, mock, suite, test} from 'node:test';

import TaskQueue from './task-queue';

const createAsyncCallback = (duration: number) => mock.fn(() => new Promise(resolve => setTimeout(resolve, duration)));

suite('TaskQueue', () => {
  beforeEach(() => {
    mock.timers.enable();
  });

  afterEach(() => {
    mock.timers.reset();
  });

  test('callback is not called after a TaskQueue is created, even after a timeout', () => {
    const asyncCallback = createAsyncCallback(0);
    new TaskQueue(asyncCallback);
    mock.timers.tick(100);
    assert.equal(asyncCallback.mock.callCount(), 0);
  });

  test('callback is called once if one item is added to the queue', () => {
    const asyncCallback = createAsyncCallback(0);
    const taskQueue = new TaskQueue<string>(asyncCallback);
    taskQueue.add('one');
    mock.timers.tick(100);
    assert.equal(asyncCallback.mock.callCount(), 1);
  });

  test('callback is called once if two items are added one after the other', () => {
    const asyncCallback = createAsyncCallback(0);
    const taskQueue = new TaskQueue<string>(asyncCallback);
    taskQueue.add('one');
    taskQueue.add('two');
    mock.timers.tick(100);
    assert.equal(asyncCallback.mock.callCount(), 1);
  });

  // TODO: this isn't working yet, fix
  test('callback is called twice if the second item is added while the first callback is running', () => {
    const asyncCallback = createAsyncCallback(100);
    const taskQueue = new TaskQueue<string>(asyncCallback);
    taskQueue.add('one');
    mock.timers.tick(50);
    taskQueue.add('two');
    mock.timers.tick(500);
    assert.equal(asyncCallback.mock.callCount(), 2);
  });
});
