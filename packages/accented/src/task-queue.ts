import type { Throttle } from './types';

type TaskCallback<T> = (items: Array<T>) => void;

export default class TaskQueue<T> {
  #throttle: Throttle;
  #asyncCallback: TaskCallback<T> | null = null;

  #items = new Set<T>();
  #inRunLoop = false;

  constructor(asyncCallback: TaskCallback<T>, throttle: Required<Throttle>) {
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

    const items = Array.from(this.#items);

    this.#items.clear();

    if (this.#asyncCallback) {
      await this.#asyncCallback(items);
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
