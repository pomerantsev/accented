# Accented

Continuous accessibility testing for webapp developers

## High-level

* Uses axe-core.

## Running locally

* `npx http-server`

## Usage notes

* On a page with many elements, axe-core may be slow. We may deal with this in two ways:
  * First, we'll ensure that we only scan the elements that changed.
  * Second, we'll see if it's possible to modify axe-core so it yields execution at certain intervals.

## Development notes

* Placeholder favicon generated with https://favicon.io/favicon-generator/. I immediately forgot what the font was, but I won't relese this like this anyway.
