// TODO: add generic typing
export default class TaskQueue {
  items = new Set();

  idleCallbackId = null;

  asyncCallback = null;

  constructor(asyncCallback) {
    this.asyncCallback = asyncCallback;
  }

  // TODO: test all the asynchronicity

  #scheduleRun() {
    if (this.idleCallbackId !== null || this.items.size === 0) {
      return;
    }

    this.idleCallbackId = requestIdleCallback(() => this.#run());
  }

  async #run() {
    this.items.clear();

    await this.asyncCallback();

    this.idleCallbackId = null;

    this.#scheduleRun();
  }

  add(item) {
    this.items.add(item);
    this.#scheduleRun();
  }
}
