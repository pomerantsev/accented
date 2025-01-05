import type axe from 'axe-core';

export type DeepRequired<T> = T extends object ? {
  [P in keyof T]-? : DeepRequired<T[P]>
} : T;

export type Throttle = {
  /**
   * The minimal time between scans.
   *
   * Default: 1000.
   * */
  wait?: number,

  /**
   * When to run the scan on Accented initialization or on a mutation.
   *
   * If true, the scan will run immediately. If false, the scan will run after the first throttle delay.
   *
   * Default: true.
   * */
  leading?: boolean
}

export type AccentedOptions = {
  /**
   * Whether to output the issues to the console.
   *
   * Default: true.
   * */
  outputToConsole?: boolean,

  /**
   * Scan throttling options object.
   * */
  throttle?: Throttle
};

/**
 * A function that fully disables Accented,
 * stopping the scanning and removing all highlights from the page.
 */
export type DisableAccented = () => void;

export type Issue = {
  id: string,
  title: string,
  description: string,
  url: string,
  impact: axe.ImpactValue
};

export type ElementWithIssues = {
  element: HTMLElement,
  issues: Array<Issue>
}
