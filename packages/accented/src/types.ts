import type axe from 'axe-core';
import type { Signal } from '@preact/signals-core';
import type { AccentedTrigger } from './elements/accented-trigger';

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

export type AxeContext = axe.ElementContext;

export const allowedAxeOptions = ['rules', 'runOnly'] as const;

export type AxeOptions = Pick<axe.RunOptions, typeof allowedAxeOptions[number]>;

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
   * The `context` parameter for `axe.run()`.
   *
   * Determines what element(s) to scan for accessibility issues.
   *
   * Accepts a variety of shapes:
   * * an element reference;
   * * a selector;
   * * a `NodeList`;
   * * an include / exclude object;
   * * and more.
   *
   * See documentation: https://www.deque.com/axe/core-documentation/api-documentation/#context-parameter
   *
   * Default: `document`.
   */
  axeContext?: AxeContext,

  /**
   * The `options` parameter for `axe.run()`.
   *
   * Accented only supports two keys of the `options` object:
   * * `rules`;
   * * `runOnly`.
   *
   * Both properties are optional, and both control
   * which accessibility rules your page is tested against.
   *
   * See documentation: https://www.deque.com/axe/core-documentation/api-documentation/#options-parameter
   *
   * Default: `{}`.
   */
  axeOptions?: AxeOptions,

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
   * Only lowercase alphanumeric characters and dashes (-) are allowed in the name,
   * and it must start with a lowercase letter.
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
  // inlineEndLeft: number,
  // blockStartTop: number,
  // direction: 'ltr' | 'rtl'
  left: number,
  top: number,
  width: number,
  height: number
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
  visible: Signal<boolean>,
  trigger: AccentedTrigger,
  position: Signal<Position>,
  scrollableAncestors: Signal<Set<HTMLElement>>
  id: number
};
