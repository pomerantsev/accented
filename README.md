# Accented

Continuous accessibility testing and issue highlighting for web development

This is a work in progress.

## Running locally

* `pnpm dev`

## Development notes

* Placeholder favicon generated with https://favicon.io/favicon-generator/. I immediately forgot what the font was, but I won't relese this like this anyway.
* In the Contributing docs, mention that `pnpm` needs to be installed first.
* For publishing, use `pnpm publish-lib`
* NodeJS >= 22 is required for development. We're using the native Node test runner.
  * The globbing there is only supported in NodeJS 21+: https://github.com/nodejs/node/issues/50658#issuecomment-1806581766
  * The `suite` method was added in Node 22: https://nodejs.org/api/test.html#suitename-options-fn
