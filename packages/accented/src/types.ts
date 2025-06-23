import type { Signal } from '@preact/signals-core';
import type axe from 'axe-core';
import type { AccentedTrigger } from './elements/accented-trigger.ts';

export type Throttle = {
  /**
   * The minimal time between scans.
   *
   * @default 1000
   * */
  wait?: number;

  /**
   * When to run the scan on Accented initialization or on a mutation.
   *
   * If `true`, the scan will run immediately. If `false`, the scan will run after the first throttle delay.
   *
   * @default true
   * */
  leading?: boolean;
};

export type Output = {
  /**
   * Whether the list of elements with issues should be printed to the browser console whenever issues are added, removed, or changed.
   *
   * @default true
   * */
  console?: boolean;
};

/**
 * Model context type based on axe.ElementContext,
 * excluding frame selectors (since we don't support scanning iframes).
 */

export type Selector = Exclude<axe.Selector, axe.LabelledFramesSelector>;

// axe.SelectorList also can have FrameSelector elements in the array.
// We're not allowing that.
export type SelectorList = Array<Selector> | NodeList;

// The rest of the type is structured the same as in axe-core.
export type ContextProp = Selector | SelectorList;

export type ContextObject =
  | {
      include: ContextProp;
      exclude?: ContextProp;
    }
  | {
      exclude: ContextProp;
      include?: ContextProp;
    };

export type Context = ContextProp | ContextObject;

export const allowedAxeOptions = ['rules', 'runOnly'] as const;

export type AxeOptions = Pick<axe.RunOptions, (typeof allowedAxeOptions)[number]>;

type CallbackParams = {
  /**
   * Nodes that got scanned. Either an array of nodes,
   * or an object with `include` and `exclude` properties (if any nodes were excluded).
   */
  scanContext: ScanContext | Array<Node>;

  /**
   * The most up-to-date array of all elements with accessibility issues.
   * */
  elementsWithIssues: Array<ElementWithIssues>;

  /**
   * Runtime performance of the last scan. An object with the following props:
   * - `totalBlockingTime`: how long the main thread was blocked by Accented during the last scan, in milliseconds.
   *   It’s further divided into the `scan` and `domUpdate` phases.
   * - `scan`: how long scanning (the execution of `axe.run()`) took, in milliseconds.
   * - `domUpdate`: how long the DOM update (adding / removing outlines and dialog trigger buttons) took, in milliseconds.
   * */
  performance: {
    totalBlockingTime: number;
    scan: number;
    domUpdate: number;
  };
};

export type Callback = (params: CallbackParams) => void;

export type AccentedOptions = {
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
   * @default {}
   */
  axeOptions?: AxeOptions;

  /**
   * A function that will be called after each scan.
   *
   * Potential uses:

   * - do something with the scan results,
   * for example send them to a backend for analysis;
   * - analyze Accented’s performance.
   *
   * @default () => {}
   *
   * @example
   *
   * accented({
   *   callback: ({ elementsWithIssues, performance }) => {
   *     console.log('Elements with issues:', elementsWithIssues);
   *     console.log('Total blocking time:', performance.totalBlockingTime);
   *   }
   * });
   *
   * */
  callback?: Callback;

  /**
   * The `context` parameter for `axe.run()`.
   *
   * Determines what part(s) of the page to scan for accessibility issues.
   *
   * Accepts a variety of shapes:
   *
   * - a [`Node`](https://developer.mozilla.org/en-US/docs/Web/API/Node) (in practice it will likely be an instance of [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element), [`Document`](https://developer.mozilla.org/en-US/docs/Web/API/Document), or [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment));
   * - a valid [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors);
   * - an object for selecting elements within shadow DOM,
   *   whose shape is `{ fromShadowDom: [selector1, selector2, ...] }`,
   *   where `selector1`, `selector2`, etc. select shadow hosts, and the last selector selects the actual context.
   *   `selector2` in this example is _within_ the shadow root created on the element(s) that match `selector1`,
   *   so in practice you shouldn’t have more than two elements in such an array
   *   unless you have a very complex structure with multiple shadow DOM layers;
   * - a [`NodeList`](https://developer.mozilla.org/en-US/docs/Web/API/NodeList) (likely a result of a [`querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) call);
   * - an array containing any combination of selectors, nodes, or shadow DOM objects (described above);
   * - an object containing `include` and / or `exclude` properties.
   *   It’s useful if you’d like to exclude certain elements or parts of the page.
   *   The values for `include` and `exclude` can take any of the above shapes.
   *   It’s unlikely that you’d want to have complex `include` / `exclude` rules,
   *   but if you do, the exact behavior is documented by the relevant tests:
   *   [`is-node-in-scan-context.test.ts`](https://github.com/pomerantsev/accented/blob/main/packages/accented/src/utils/is-node-in-scan-context.test.ts).
   *
   * See also the documentation for the [`context` parameter of `axe.run()`](https://www.deque.com/axe/core-documentation/api-documentation/#context-parameter),
   * which the `context` option from Accented mostly mirrors
   * (note that Accented doesn’t support the `fromFrames` object shape).
   *
   * @default document
   */
  context?: Context;

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
   * @default 'accented'
   */
  name?: string;

  /**
   * An object controlling how the results of scans will be presented.
   * */
  output?: Output;

  /**
   * Scan throttling options object.
   * */
  throttle?: Throttle;
};

/**
 * A function that fully disables Accented,
 * stopping the scanning and removing all highlights from the page.
 */
export type DisableAccented = () => void;

export type Position = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  url: string;
  impact: axe.ImpactValue;
};

export type BaseElementWithIssues = {
  element: HTMLElement | SVGElement;
  rootNode: Node;
};

export type ElementWithIssues = BaseElementWithIssues & {
  issues: Array<Issue>;
};

export type ExtendedElementWithIssues = BaseElementWithIssues & {
  issues: Signal<ElementWithIssues['issues']>;
  visible: Signal<boolean>;
  trigger: AccentedTrigger;
  position: Signal<Position>;
  skipRender: boolean;
  anchorNameValue: string;
  scrollableAncestors: Signal<Set<Element>>;
  id: number;
};

export type ScanContext = {
  include: Array<Node>;
  exclude: Array<Node>;
};
