---
layout: ../../layouts/DocsLayout.astro
---

# Contributing

## Running locally

- `pnpm dev`

## Development notes

- Favicon generated with https://favicon.io/favicon-generator/ (the favicon.ico files contain the 16, 32, and 48 sizes — we are unlikely to need anything else).
  - Text: á
  - Font color: #ffffff
  - Background color:
    - #bb005e for the website (the closest RGB to the primary oklch(0.5 0.3 0), according to https://oklch.com/)
    - #005f87 for the devapp (the closest RGB to the focus color oklch(0.45 0.25 230), according to https://oklch.com/)
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
