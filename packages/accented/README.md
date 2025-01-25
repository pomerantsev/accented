# Accented

Accented is a library that helps visually identify accessibility issues in a website or webapp under development.

It can be set up in only a few lines of code

It complements approaches to other means of continuous automated accessibility testing such as static code analysis and inclusion of accessibility tests in test suites. Think of it as a form of linting, but for a rendered web page rather than for source code.

Accented uses the [axe-core](https://github.com/dequelabs/axe-core) testing engine.

TODO: example screenshots, without Accented / with Accented.

## Basic usage

* The library can be used in three ways:
  * NPM (with a bundler)
  * `import accented from 'https://esm.sh/accented';`.
  * `import('https://esm.sh/accented').then(({default: accented}) => { accented(); });` (this version will work in the console, unless it violates the content security policy, which shouldn't be the case locally).
    * For example, this works on medium.com

## API

### Exports

* `accented`: the default library export. It’s the function that enables the continuous scanning and highlighting
  on the page in whose context in was called. Example: `const disable = accented(options)`.
  * Parameters: the only parameter is `options`. See [Options](#options).
  * Returns: a `disable` function that takes no parameters. When called, disables the scanning and highlighting,
    and cleans up any changes that Accented has made to the page.

#### Type exports

The following types are exported for TypeScript consumers:

* `AccentedOptions`: the `options` parameter (see [Options](#options)).
* `DisableAccented`: the type of the function returned by `accented`.

### Options

#### `outputToConsole`

**Type:** boolean.

**Default:** `true`.

Whether the list of elements with issues should be printed to the browser console whenever issues are added, removed, or changed.

#### `callback`

**Type:** function.

**Default:** no-op (`() => {}`).

A function that Accented will call after every scan.
It accepts a single `params` object with the following properties:

* `elementsWithIssues`: the most up-to-date array of all elements with accessibility issues.
* `scanDuration`: how long the last scan took, in milliseconds (may be useful for performance tracking).

**Example:**

```
accented({
  callback: ({ elementsWithIssues, scanDuration }) => {
    console.log('Elements with issues:', elementsWithIssues);
    console.log('Scan duration:', scanDuration);
  }
});
```

#### `name`

**Type:** string.

**Default:** `"accented"`.

The character sequence that’s used in various elements, attributes and stylesheets that Accented adds to the page.

You shouldn’t have to use this attribute unless some of the names on your page conflict with what Accented provides by default.

* The data attribute that’s added to elements with issues (default: `data-accented`).
* The custom elements for the button and the dialog that get created for each element with issues
  (default: `accented-trigger`, `accented-dialog`).
* The CSS cascade layer containing page-wide Accented-specific styles (default: `accented`).
* The prefix for some of the CSS custom properties used by Accented (default: `--accented-`).

**Example:**

```
accented({name: 'my-name'});
```

With the above option provided, the attribute set on elements with issues will be `data-my-name`,
a custom element will be called `my-name-trigger`, and so on.

#### `throttle`

An object controlling when Accented will run its scans.

#### `throttle.wait`

**Type:** number.

**Default:** 1000.

The delay (in milliseconds) after a mutation or after the last Accented scan.

If the page you’re scanning has a lot of nodes,
scanning may take a noticeable time (~ a few hundred milliseconds),
during which time the main thread will be blocked most of the time.

You may want to experiment with this value if your page contents change frequently
or if it has JavaScript-based animations running on the main thread.

#### `throttle.leading`

**Type:** boolean.

**Default:** `true`.

If set to true, the scan runs immediately after a mutation.
In this case, `wait` only applies to subsequent scans,
giving the page at least `wait` milliseconds between the end of the previous scan
and the beginning of the next one.

If set to false, the wait applies to mutations as well,
delaying the output.
This may be useful if you’re expecting bursts of mutations on your page.

### Styling

TODO: Create a separate doc with info on using `:root` and CSS layers to control some aspects of styling.

## Miscellaneous

### Shadow DOM

Highlighting elements inside shadow DOM is not supported yet, see [#25](https://github.com/pomerantsev/accented/issues/25).

### Iframes

Although axe-core is capable of scanning iframes, Accented doesn’t provide that as a special capability.

Instead, if you wish to scan the document in an iframe, initialize Accented inside the iframed document.
There should be no interference between the instances of Accented running in the parent and child documents.

TODO: expand this section and better explain the concepts.

## Frequently asked questions

<!-- TODO: how can this section be better formatted? This probably should be regular sections rather than a Q&A. -->

**Q:** can Accented be used in a CI (continuous integration) environment?

**A:** no, it’s only meant for local development. Accented runs accessibility tests on every state of the page that’s currently in the developer’s browser. However, if you additionally need something for CI, consider using [axe-core](https://www.npmjs.com/package/axe-core) in your automated test suite, either directly, or through wrappers such as [jest-axe](https://www.npmjs.com/package/jest-axe) or [axe-playwright](https://www.npmjs.com/package/axe-playwright).

**Q:** does Accented affect performance?

**A:** TODO: it might (it’s inevitable because it’s on the main thread), but we’ve taken X, Y, and Z measures to make it less noticeable. You can also take A, B, and C steps yourself.
  * Only re-running on the changed part of the page.
  * Throttling calls and giving the ability to tweak it.
  * Providing the ability to select which rules to run, and which elements to run them on.
  * TODO: explore axe-core’s internals. Can I make it yield periodically?
