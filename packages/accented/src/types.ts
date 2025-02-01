import type axe from 'axe-core';
import type { Signal } from '@preact/signals-core';
import type { AccentedTrigger } from './elements/accented-trigger';

export type DeepRequired<T> = T extends object ? {
  [P in keyof T]-? : DeepRequired<T[P]>
} : T;

export type Throttle = {
  /**
   * The minimal time between scans.
   *
   * Default: `1000`.
   * */
  wait?: number,

  /**
   * When to run the scan on Accented initialization or on a mutation.
   *
   * If `true`, the scan will run immediately. If `false`, the scan will run after the first throttle delay.
   *
   * Default: `true`.
   * */
  leading?: boolean
}

export type Output = {
  /**
   * Whether to output the issues to the console.
   *
   * Default: `true`.
   * */
  console?: boolean
}

type CallbackParams = {
  /**
   * The most current array of elements with issues.
   * */
  elementsWithIssues: Array<ElementWithIssues>,

  /**
   * How long the scan took in milliseconds.
   * */
  scanDuration: number
}

export type Callback = (params: CallbackParams) => void;

export type AccentedOptions = {

  /**
   * The character sequence that’s used in various elements, attributes and stylesheets that Accented adds to the page.
   * * The data attribute that’s added to elements with issues (default: `data-accented`).
   * * The custom elements for the button and the dialog that get created for each element with issues
   *   (default: `accented-trigger`, `accented-dialog`).
   * * The CSS cascade layer containing page-wide Accented-specific styles (default: `accented`).
   * * The prefix for some of the CSS custom properties used by Accented (default: `--accented-`).
   * * The window property that’s used to prevent multiple axe-core scans from running simultaneously
   *   (default: `__accented_axe_running__`).
   *
   * Default: `accented`.
   */
  name?: string,

  /**
   * Output options object.
   * */
  output?: Output,

  /**
   * Scan throttling options object.
   * */
  throttle?: Throttle,

  /**
   * A callback that will be called after each scan.
   *
   * Default: `() => {}`.
   * */
  callback?: Callback
};

/**
 * A function that fully disables Accented,
 * stopping the scanning and removing all highlights from the page.
 */
export type DisableAccented = () => void;

export type Position = {
  inlineEndLeft: number,
  blockStartTop: number,
  direction: 'ltr' | 'rtl'
};

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

export type ExtendedElementWithIssues = Omit<ElementWithIssues, 'issues'> & {
  issues: Signal<ElementWithIssues['issues']>,
  trigger: AccentedTrigger,
  position: Signal<Position>,
  id: number
};
