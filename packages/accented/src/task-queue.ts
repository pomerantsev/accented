import type { Throttle } from './types';

type TaskCallback = () => void;

export default class TaskQueue<T> {
  #throttle: Throttle;
  #asyncCallback: TaskCallback | null = null;

  #items = new Set<T>();
  #inRunLoop = false;

  constructor(asyncCallback: TaskCallback, throttle: Required<Throttle>) {
    this.#asyncCallback = asyncCallback;
    this.#throttle = throttle;
  }

  async #preRun() {
    if (this.#inRunLoop) {
      return;
    }
    this.#inRunLoop = true;

    if (!this.#throttle.leading) {
      await new Promise((resolve) => setTimeout(resolve, this.#throttle.wait));
    }

    await this.#run();
  }

  async #run() {
    if (this.#items.size === 0) {
      this.#inRunLoop = false;
      return;
    }

    this.#items.clear();

    if (this.#asyncCallback) {
      await this.#asyncCallback();
    }

    await new Promise((resolve) => setTimeout(resolve, this.#throttle.wait));

    await this.#run();
  }

  addMultiple(items: Array<T>) {
    for (const item of items) {
      this.#items.add(item);
    }
    if (this.#items.size > 0) {
      this.#preRun();
    }
  }

  add(item: T) {
    this.addMultiple([item]);
  }
}
