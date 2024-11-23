type TaskCallback = () => void;

// TODO: add generic typing
export default class TaskQueue<T> {
  items = new Set<T>();

  idleCallbackId: number | null = null;

  asyncCallback: TaskCallback | null = null;

  constructor(asyncCallback: TaskCallback) {
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

    if (this.asyncCallback) {
      await this.asyncCallback();
    }

    this.idleCallbackId = null;

    this.#scheduleRun();
  }

  add(item: T) {
    this.items.add(item);
    this.#scheduleRun();
  }
}
