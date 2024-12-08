# Accented

Continuous accessibility testing and issue highlighting for web development

This is a work in progress.

## High-level

* Uses axe-core.

## Running locally

* `pnpm dev`

## Usage notes

* On a page with many elements, axe-core may be slow. We may deal with this in two ways:
  * First, we'll ensure that we only scan the elements that changed.
  * Second, we'll see if it's possible to modify axe-core so it yields execution at certain intervals.
* The library can be used in three ways:
  * NPM (with a bundler)
  * `import accented from 'https://cdn.jsdelivr.net/npm/accented@0.0.1-dev.0/+esm';`.
  * `import('https://cdn.jsdelivr.net/npm/accented@0.0.1-dev.0/+esm').then(({default: accented}) => { accented(); });` (this version will work in the console, unless it violates the content security policy, which shouldn't be the case locally).
    * For example, this works on medium.com

## Development notes

* Placeholder favicon generated with https://favicon.io/favicon-generator/. I immediately forgot what the font was, but I won't relese this like this anyway.
* In the Contributing docs, mention that `pnpm` needs to be installed first.
* For publishing, use `pnpm publish-lib`
* NodeJS >= 22 is required for development. We're using the native Node test runner.
  * The globbing there is only supported in NodeJS 21+: https://github.com/nodejs/node/issues/50658#issuecomment-1806581766
  * The `suite` method was added in Node 22: https://nodejs.org/api/test.html#suitename-options-fn
