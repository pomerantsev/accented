---
layout: ../../layouts/DocsLayout.astro
---

# API

## Exports

- `accented`: the default library export. It’s the function that enables the continuous scanning and highlighting
  on the page in whose context in was called. Example: `const disable = accented(options)`.
  - Parameters: the only parameter is `options`. See [Options](#options).
  - Returns: a `disable` function that takes no parameters. When called, disables the scanning and highlighting,
    and cleans up any changes that Accented has made to the page.

### Type exports

The following types are exported for TypeScript consumers:

- `AccentedOptions`: the `options` parameter (see [Options](#options)).
- `DisableAccented`: the type of the function returned by `accented`.

## Options

### `context`

TODO: update

**Type:** see [documentation](https://www.deque.com/axe/core-documentation/api-documentation/#context-parameter).

**Default:** `document`.

The `context` parameter for `axe.run()`.

Determines what element(s) to scan for accessibility issues.

Accepts a variety of shapes:

- an element reference;
- a selector;
- a `NodeList`;
- an include / exclude object;
- and more.

See documentation: https://www.deque.com/axe/core-documentation/api-documentation/#context-parameter

### `axeOptions`

**Type:** object.

**Default:** `{}`.

The `options` parameter for `axe.run()`.

Accented only supports two keys of the `options` object:

- `rules`;
- `runOnly`.

Both properties are optional, and both control which accessibility rules your page is tested against.

See documentation: https://www.deque.com/axe/core-documentation/api-documentation/#options-parameter

### `output`

An object controlling how the results of scans will be presented.

### `output.console`

**Type:** boolean.

**Default:** `true`.

Whether the list of elements with issues should be printed to the browser console whenever issues are added, removed, or changed.

### `callback`

**Type:** function.

**Default:** no-op (`() => {}`).

A function that Accented will call after every scan.
It accepts a single `params` object with the following properties:

- `elementsWithIssues`: the most up-to-date array of all elements with accessibility issues.
- `performance`: runtime performance of the last scan. An object:
  - `totalBlockingTime`: how long the main thread was blocked by Accented during the last scan, in milliseconds.
    It’s further divided into the `scan` and `domUpdate` phases.
  - `scan`: how long the `scan` phase took, in milliseconds.
  - `domUpdate`: how long the `domUpdate` phase took, in milliseconds.
  - `scanContext`: nodes that got scanned. Either an array of nodes,
    or an object with `include` and `exclude` properties (if any nodes were excluded).

**Example:**

```
accented({
  callback: ({ elementsWithIssues, performance }) => {
    console.log('Elements with issues:', elementsWithIssues);
    console.log('Total blocking time:', performance.totalBlockingTime);
  }
});
```

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
