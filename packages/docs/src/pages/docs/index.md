---
layout: ../../layouts/DocsLayout.astro
---

# Documentation

Continuous accessibility testing and issue highlighting for web development

This is a work in progress.

See [Getting started](/docs/getting-started/).

## Running locally

- `pnpm dev`

## Development notes

- Placeholder favicon generated with https://favicon.io/favicon-generator/.
  - Text: á
  - Font color: #ffffff
  - Background color: #bb005e (the closest RGB to the primary oklch(0.5 0.3 0), according to https://oklch.com/)
  - Background: rounded
  - Font family: Noto Sans
  - Font variant: Regular 400 Normal
  - Font size: 110
- In the Contributing docs, mention that `pnpm` needs to be installed first.
- To update dependencies, run `pnpm update --recursive --latest` (or `pnpm up -rL`) (TODO: try offloading this to dependabot)
- For publishing, we're using Changesets that does everything automatically for us. We only need to run `pnpm changeset` on every changeset.
- NodeJS >= 22 is required for development. We're using the native Node test runner.
  - The globbing there is only supported in NodeJS 21+: https://github.com/nodejs/node/issues/50658#issuecomment-1806581766
  - The `suite` method was added in Node 22: https://nodejs.org/api/test.html#suitename-options-fn
