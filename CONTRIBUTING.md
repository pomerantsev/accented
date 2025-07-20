# Contributing

TODO: clean up and expand this doc, see #177.

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

## Principles

### Design principles

TODO

### Error handling

Global philosophy: rethrow all errors with as meaningful a message as possible.
If this is an unknown error, suggest a browser update.
In any case (except the most obvious ones, such as parameter validation), mention where to file issues.

Add a try-catch block in every code block that's called asynchronously, and cover as much of the callback as possible.

All custom elements lifecycle methods need to be wrapped in try-catch (because they’re called asynchronously by the browser).

In the case of the Axe run failing, it's okay to swallow the error: if we rethrow it,
it will also be caught by the outer try-catch block.

If async code is simple enough and well tested (such as in task-queue.ts),
it may not need explicit error handling.

## Decisions

### Trigger placement in the DOM

**Decision:** Place the triggers next to their respective elements (as opposed to placing them all in one HTML element).

Pros:

- The primary reason is it seems to be impossible to have an interactive popover for some content in a modal dialog,
  where the popover lives outside the dialog.
  See https://github.com/whatwg/html/issues/9936.
  And I haven’t found a way to determine whether the element is within a modal dialog:
  it’s trivial to determine whether we’re within a dialog,
  but nothing to tell us whether it’s modal: https://html.spec.whatwg.org/multipage/interactive-elements.html#htmldialogelement
  (I haven’t found any property for whether it’s modal, nor have I been able to check for inert on out-of-dialog elements).
- It’s trivial to maintain correct focus order this way, and there’s no need in a skip link.

Cons:

- It may lead to invalid HTML in some cases
  (like when the element with an issue is an `li`, leading to the parent `ul` having non-`li` children).
- It may lead to toggling an element’s issue state,
  in case the issue is about an element not having text content,
  for example (the trigger adds text content because the button has an accessible name).
- Table rendering may become incorrect.
  TODO: Determine how bad it is. At least, document it. Ideally, find some sort of a solution. Write tests.

### Trigger positioning

**Decision 1:** use anchor positioning in supporting browsers.

Pros:

- Positioning requires much less JS code and is mostly handled by the browser.
- Better performance.

Cons:

- We may not always be handling anchor-name property dynamic changes.
  We try to be the least disruptive, but I don’t think we can eliminate all possible issues.
- If positioning of the element with issues include CSS transforms,
  anchor positioning doesn’t work as expected — it is so by design currently,
  so if this works better without anchor positioning,
  we may need to rethink our approach or give the consumer a way to opt out.
- Another challenge of anchor positioning has to do with testing in Playwright.
  Playwright doesn’t scroll into view the fixed-positioned anchored elements.
  And we can’t use `position: absolute` because it doesn’t work as expected on fixed-positioned triggers.

**Decision 2:** use fixed positioning (as opposed to absolute positioning)
as a fallback in browsers that don’t support anchor positioning.

Note: this choice may be not as important,
with anchor positioning hopefully coming to Safari and Firefox in 2026.

Pros:

- Fixed positioning with updates on scroll may be the only way to support attaching triggers to elements that have `position: sticky`.
- Positioning is slightly easier than for elements with absolute positioning:
  We don’t need to find the position within the nearest scrollable container, just on the screen.

Cons:

- Scroll jank.
- Scroll recomputations become expensive if there are many elements with issues.
- There’s additional overhead with ensuring that multiple scrolling regions on the page are taken care of.

### Shadow DOM styling

Setting `!important` styles on `:host` (particularly `all: initial !important`) seems to completely prevent
host app styles from leaking into the elements introduced by Accented.
That's even true for cases where the specificity of a host app selector is higher
(and the declaration has `!important` as well).

### Browser support

In the [browser support policy](https://accented.dev/about#browser-support),
we decided to list specific browser versions,
as opposed to supporting a certain year’s [baseline](https://web.dev/baseline).

The reason is, the primary purpose here is to have a framework for deciding
whether to fix a specific bug in a specific browser version.

### Known issues / limitations

- In Safari, pinch-zoom leads to incorrectly positioned triggers.
  In Safari, top CSS prop doesn’t match what’s returned for the trigger element by getBoundingClientRect() when zoomed.
  See https://bugs.webkit.org/show_bug.cgi?id=207089
- In Firefox, when "Zoom text only" setting is on, zooming does not lead to trigger repositioning.
  I don't know if there's any event that fires when such zoom happens, so there may be no way to address it.

## Development

TODO: Biome configuration in editor

## Testing

### Running unit tests

TODO

### Running end-to-end tests

TODO

## Versioning and releasing

TODO: link to versioning doc

We’re using [Changesets](https://github.com/changesets/changesets) to automate the version and release process of Accented as much as possible.

See [Versioning policy](https://accented.dev/about#versioning) when making versioning decisions.

### Marking a change that requires a version bump

When a code is being written / a pull request is being made, we should ask ourselves whether it may affect the consumers of Accented.
In other words, does this change deserve an entry in the changelog for the upcoming version?

If the above is true, run `pnpm changeset` and follow the interactive prompts.
This will create a file that describes the change and its severity according to [semver](https://semver.org/) (Patch, Minor, or Major).

The library version is **not** bumped at this time.

**Examples of changes requiring changesets:**

- A change in the business logic / UI / API (obviously).
- A bug fix / performance improvement.
- A dependency version bump.
  - For runtime dependencies, we’ll definitely bump the version, even if nothing is changing for consumers.
  - For build dependencies that may affect the generated code (for example, typescript), create a patch change.
  - For other development dependencies, don't add a changeset (this bump shouldn’t affect consumers at all).
- A development dependency version bump (if it may potentially change the compiled code).
- A Readme update (if that’s the Readme that gets published on NPM).

**Examples of changes that don’t require changesets:**

- A change in testing code.
- A change in the devapp.
- A CI config change.

There’s a bot provided by Changesets that comments on each pull request reminding that a changeset is expected along with the pull request.
Use your best judgment to decide whether it’s actually needed.

### Releasing a new version

This process is mostly automated.

There’s a pull request that’s kept up-to-date by a Changesets Github action,
and a human’s only job is to merge it when the time comes to release the next version.

**The pull request contains the following:**

- An Accented version bump, based on all the changesets on the main branch so far.
- A changelog update, also based on all the changesets.
- The removal of all the changesets (we start clean after a version bump).

**Merging the pull request performs the following actions:**

- Publishing the new version to NPM.
- Creating a tag and a release in Github that duplicates the changelog entry contents.

**Note:** Before merging, consider reformatting the changelog entries.
We’re using a default format provided by [@changesets/changelog-github](https://www.npmjs.com/package/@changesets/changelog-github),
however that’s not very flexible, and we’d like to replace it with a custom format moving forward.

### Releasing a snapshot version

We may choose to release a snapshot version for testing at any time.
This will **not** change the `latest` distribution tag on NPM,
and the version is `0.0.0-<timestamp>`,
therefore consumers will never install it accidentally.

To create a snapshot version, push a branch whose name starts with `snapshot`.
The CI server publishes a new snapshot release on every push to such a branch.

The version can then be installed by a consumer either by its version number (`accented@0.0.0-<timestamp>`)
or by the `snapshot` tag (`accented@snapshot`).

### Known issues

#### Incorrect trigger positioning when pinch-zooming in Safari

- It may be hard to fix it in Safari, so we may as well ignore it.
- This may be related: [https://bugs.webkit.org/show_bug.cgi?id=207089](https://bugs.webkit.org/show_bug.cgi?id=207089)
- In Safari, top CSS prop doesn’t match what’s returned for the trigger element by getBoundingClientRect() when zoomed.
- Can we maybe get zoom level somehow? Or maybe this will not help?
