# Accented

Continuous accessibility testing and issue highlighting for web development

This is a work in progress.

## High-level

* Uses axe-core.

## Running locally

* `npx http-server`

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
