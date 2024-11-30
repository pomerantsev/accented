type TaskCallback = () => void;

export default class TaskQueue<T> {
  items = new Set<T>();

  // I'm not sure why the editor needs NodeJS.Timeout here.
  // tsconfig.json doesn't mention that the code needs to run in Node.
  // Maybe it's somehow related to the fact that we're using the Node test runner.
  timeoutId: number | NodeJS.Timeout | null = null;

  asyncCallback: TaskCallback | null = null;

  constructor(asyncCallback: TaskCallback) {
    this.asyncCallback = asyncCallback;
  }

  #scheduleRun() {
    if (this.timeoutId !== null || this.items.size === 0) {
      return;
    }

    this.timeoutId = setTimeout(() => this.#run());
  }

  async #run() {
    this.items.clear();

    if (this.asyncCallback) {
      await this.asyncCallback();
    }

    this.timeoutId = null;

    this.#scheduleRun();
  }

  add(item: T) {
    this.items.add(item);
    this.#scheduleRun();
  }
}
