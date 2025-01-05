import type { Throttle } from './types';

type TaskCallback = () => void;

export default class TaskQueue<T> {
  #items = new Set<T>();
  #runningOrScheduled = false;
  #throttle: Throttle;

  // I'm not sure why the editor needs NodeJS.Timeout here.
  // tsconfig.json doesn't mention that the code needs to run in Node.
  // Maybe it's somehow related to the fact that we're using the Node test runner.
  #timeoutId: number | NodeJS.Timeout | null = null;

  #asyncCallback: TaskCallback | null = null;

  constructor(asyncCallback: TaskCallback, throttle: Required<Throttle>) {
    this.#asyncCallback = asyncCallback;
    this.#throttle = throttle;
  }

  #scheduleRun() {
    if (this.#items.size === 0) {
      this.#runningOrScheduled = false;
    }
    if (this.#timeoutId !== null || this.#items.size === 0) {
      return;
    }

    const delay = this.#runningOrScheduled ?
      this.#throttle.wait :
      this.#throttle.leading ? 0 : this.#throttle.wait;
    this.#runningOrScheduled = true;
    this.#timeoutId = setTimeout(() => this.#run(), delay);
  }

  async #run() {
    this.#items.clear();

    if (this.#asyncCallback) {
      await this.#asyncCallback();
    }

    this.#timeoutId = null;

    this.#scheduleRun();
  }

  add(item: T) {
    this.#items.add(item);
    this.#scheduleRun();
  }
}
