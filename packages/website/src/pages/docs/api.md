---
layout: ../../layouts/DocsLayout.astro
---

# API

## Exports

- `accented`. The function that enables the continuous scanning and highlighting of accessibility issues
  on the page.
  Example: `const disable = accented(options)`.
  - Parameters: the only parameter is `options`. See [Options](#options).
  - Returns: a `disable` function that takes no parameters. When called, disables the scanning and highlighting,
    and cleans up any changes that Accented has made to the page.
    TODO: add link to a deeper dive that explains what changes may not be reverted (if any).

### Type exports

The following types are exported for TypeScript consumers:

- `AccentedOptions`: the `options` parameter (see [Options](#options)).
- `DisableAccented`: the type of the function returned by `accented`.

## Options

### `axeOptions`

**Type:** object.

**Default:** `{}`.

The `options` parameter for `axe.run()`.

Accented only supports two keys of the `options` object:

- `rules`;
- `runOnly`.

Both properties are optional, and both control which accessibility rules your page is tested against.

See documentation: https://www.deque.com/axe/core-documentation/api-documentation/#options-parameter

### `callback`

**Type:** function.

**Default:** no-op (`() => {}`).

A function that will be called after each scan.

Potential uses:

- do something with the scan results,
  for example send them to a backend for analysis;
- analyze Accented’s performance.

It accepts a single `params` object with the following properties:

- `scanContext`: nodes that got scanned. Either an array of nodes,
  or an object with `include` and `exclude` properties (if any nodes were excluded).
- `elementsWithIssues`: the most up-to-date array of all elements with accessibility issues.
- `performance`: runtime performance of the last scan. An object with the following props:
  - `totalBlockingTime`: how long the main thread was blocked by Accented during the last scan, in milliseconds.
    It’s further divided into the `scan` and `domUpdate` phases.
  - `scan`: how long scanning (the execution of `axe.run()`) took, in milliseconds.
  - `domUpdate`: how long the DOM update (adding / removing outlines and dialog trigger buttons) took, in milliseconds.

**Example:**

```
accented({
  callback: ({ elementsWithIssues, performance }) => {
    console.log('Elements with issues:', elementsWithIssues);
    console.log('Total blocking time:', performance.totalBlockingTime);
  }
});
```

### `context`

**Type:** see details below.

**Default:** `document`.

The `context` parameter for `axe.run()`.

Determines what part(s) of the page to scan for accessibility issues.

Accepts a variety of shapes:

- a [`Node`](https://developer.mozilla.org/en-US/docs/Web/API/Node) (in practice it will likely be an instance of [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element), [`Document`](https://developer.mozilla.org/en-US/docs/Web/API/Document), or [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment));
- a valid [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors);
- an object for selecting elements within shadow DOM,
  whose shape is `{ fromShadowDom: [selector1, selector2, ...] }`,
  where `selector1`, `selector2`, etc. select shadow hosts, and the last selector selects the actual context.
  `selector2` in this example is _within_ the shadow root created on the element(s) that match `selector1`,
  so in practice you shouldn’t have more than two elements in such an array
  unless you have a very complex structure with multiple shadow DOM layers;
- a [`NodeList`](https://developer.mozilla.org/en-US/docs/Web/API/NodeList) (likely a result of a [`querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) call);
- an array containing any combination of selectors, nodes, or shadow DOM objects (described above);
- an object containing `include` and / or `exclude` properties.
  It’s useful if you’d like to exclude certain elements or parts of the page.
  The values for `include` and `exclude` can take any of the above shapes.
  It’s unlikely that you’d want to have complex `include` / `exclude` rules,
  but if you do, the exact behavior is documented by the relevant tests:
  [`is-node-in-scan-context.test.ts`](https://github.com/pomerantsev/accented/blob/main/packages/accented/src/utils/is-node-in-scan-context.test.ts).

See also the documentation for the [`context` parameter of `axe.run()`](https://www.deque.com/axe/core-documentation/api-documentation/#context-parameter),
which the `context` option from Accented mostly mirrors
(note that Accented doesn’t support the `fromFrames` object shape).

### `name`

**Type:** string.

**Default:** `"accented"`.

The character sequence that’s used in various elements, attributes and stylesheets that Accented adds to the page.

You shouldn’t have to use this attribute unless some of the names on your page conflict with what Accented provides by default.

- The data attribute that’s added to elements with issues (default: `data-accented`).
- The custom elements for the button and the dialog that get created for each element with issues
  (default: `accented-trigger`, `accented-dialog`).
- The CSS cascade layer containing page-wide Accented-specific styles (default: `accented`).
- The prefix for some of the CSS custom properties used by Accented (default: `--accented-`).
- The window property that’s used to prevent multiple axe-core scans from running simultaneously
  (default: `__accented_axe_running__`).

Only lowercase alphanumeric characters and dashes (-) are allowed in the name,
and it must start with a lowercase letter.

**Example:**

```
accented({name: 'my-name'});
```

With the above option provided, the attribute set on elements with issues will be `data-my-name`,
a custom element will be called `my-name-trigger`, and so on.

### `output`

An object controlling how the results of scans will be presented.

### `output.console`

**Type:** boolean.

**Default:** `true`.

Whether the list of elements with issues should be printed to the browser console whenever issues are added, removed, or changed.

### `throttle`

An object controlling when Accented will run its scans.

### `throttle.wait`

**Type:** number.

**Default:** 1000.

The delay (in milliseconds) after a mutation or after the last Accented scan.

If the page you’re scanning has a lot of nodes,
scanning may take a noticeable time (~ a few hundred milliseconds),
during which time the main thread will be blocked most of the time.

You may want to experiment with this value if your page contents change frequently
or if it has JavaScript-based animations running on the main thread.

### `throttle.leading`

**Type:** boolean.

**Default:** `true`.

If set to true, the scan runs immediately after a mutation.
In this case, `wait` only applies to subsequent scans,
giving the page at least `wait` milliseconds between the end of the previous scan
and the beginning of the next one.

If set to false, the wait applies to mutations as well,
delaying the output.
This may be useful if you’re expecting bursts of mutations on your page.

## Styling

TODO: Create a separate doc with info on using `:root` and CSS layers to control some aspects of styling.

Documented CSS custom props:

- `--accented-primary-color`
- `--accented-secondary-color`
- `--accented-outline-width`
- `--accented-outline-style`
