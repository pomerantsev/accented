# Accented

Accented is a library that helps visually identify accessibility issues in a website or webapp under development.

It can be set up in only a few lines of code

It complements approaches to other means of continuous automated accessibility testing such as static code analysis and inclusion of accessibility tests in test suites. Think of it as a form of linting, but for a rendered web page rather than for source code.

Accented uses the [axe-core](https://github.com/dequelabs/axe-core) testing engine.

TODO: example screenshots, without Accented / with Accented.

## Usage

### Installation and setup

* The library can be used in three ways:
  * NPM (with a bundler)
  * `import accented from 'https://cdn.jsdelivr.net/npm/accented@0.0.1-dev.0/+esm';`.
  * `import('https://cdn.jsdelivr.net/npm/accented@0.0.1-dev.0/+esm').then(({default: accented}) => { accented(); });` (this version will work in the console, unless it violates the content security policy, which shouldn't be the case locally).
    * For example, this works on medium.com

### API

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
