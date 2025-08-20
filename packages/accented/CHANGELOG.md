# accented

## 1.1.0

### Minor Changes

- Make console output a lot more user-friendly ([#268](https://github.com/pomerantsev/accented/pull/268))

- Add `output.page` option to support console-only mode ([#268](https://github.com/pomerantsev/accented/pull/268))

### Patch Changes

- Bump typescript from 5.8.3 to 5.9.2 (no functional changes) ([#252](https://github.com/pomerantsev/accented/pull/252))

## 1.0.1

### Patch Changes

- Fix trigger positioning in Safari Technology Preview ([`f503408`](https://github.com/pomerantsev/accented/commit/f503408d59f47d5b2f9737d058ad7a61213dea1a))

- Bump @preact/signals-core to 1.11.0 (no functional changes) ([#214](https://github.com/pomerantsev/accented/pull/214))

## 1.0.0

### Major Changes

- Improve runtime performance by only re-scanning the changed parts of the DOM ([#129](https://github.com/pomerantsev/accented/pull/129))

- Rename `axeContext` to `context`

- Change signature of `callback` by adding the DOM update duration ([#127](https://github.com/pomerantsev/accented/pull/127))

- Use named exports everywhere (including the external export) ([#155](https://github.com/pomerantsev/accented/pull/155))

### Minor Changes

- Stop rendering issues in nested SVGs ([#136](https://github.com/pomerantsev/accented/pull/136))

- Add a `performance.scanContext` prop to callback ([#145](https://github.com/pomerantsev/accented/pull/145))

- Move `scanContext` from `performance` to root of callback prop object ([#162](https://github.com/pomerantsev/accented/pull/162))

- Implement scanning and issue highlighting in open shadow DOM ([#125](https://github.com/pomerantsev/accented/pull/125))

### Patch Changes

- Fix positioning of triggers on elements that have CSS transforms applied ([#117](https://github.com/pomerantsev/accented/pull/117))

- Disable asset preloading (which could result in CORS errors) ([#166](https://github.com/pomerantsev/accented/pull/166))

- Remove `rootNode` from console output ([#151](https://github.com/pomerantsev/accented/pull/151))

- Update appearance ([#131](https://github.com/pomerantsev/accented/pull/131))

- Fix trigger positioning in containing blocks in Safari and Firefox ([#148](https://github.com/pomerantsev/accented/pull/148))

- Prevent click handlers on ancestors of triggers from being invoked ([#123](https://github.com/pomerantsev/accented/pull/123))

- Stop rendering issues on `<head>` and its descendants ([#139](https://github.com/pomerantsev/accented/pull/139))

- Small fixes to satisfy new linter ([#154](https://github.com/pomerantsev/accented/pull/154))

- Add MPL-2.0 license notice ([#134](https://github.com/pomerantsev/accented/pull/134))

- Update character on the trigger ([#146](https://github.com/pomerantsev/accented/pull/146))

- Stop showing issues that may be caused by Accented itself ([#120](https://github.com/pomerantsev/accented/pull/120))

- Increase text-to-background contrast ratio in triggers ([#123](https://github.com/pomerantsev/accented/pull/123))

- Ensure the Accented trigger is always visible on a `<summary>` ([#144](https://github.com/pomerantsev/accented/pull/144))

- Fix deep-merge (nodes must not be merged) ([#162](https://github.com/pomerantsev/accented/pull/162))

- Fix propagation of Esc press (PR #114) ([#115](https://github.com/pomerantsev/accented/pull/115))

- Fix layout thrashing issue ([#128](https://github.com/pomerantsev/accented/pull/128))

- Make font sizes legible regardless of the document's base font size ([#124](https://github.com/pomerantsev/accented/pull/124))

- Disable user text selection on trigger ([#162](https://github.com/pomerantsev/accented/pull/162))

- Fix trigger positioning within transformed elements in Safari and Firefox ([#112](https://github.com/pomerantsev/accented/pull/112))

- Ensure that dialog doesn't disappear by itself (without user closing it) ([#152](https://github.com/pomerantsev/accented/pull/152))

- Stop Accented from breaking table layouts ([#140](https://github.com/pomerantsev/accented/pull/140))

- Fix deduplication algorithm ([#138](https://github.com/pomerantsev/accented/pull/138))

- Fix trigger visibility in Chrome when overflowing overflow: visible containers ([#160](https://github.com/pomerantsev/accented/pull/160))

- Upgrade axe-core and typescript ([#147](https://github.com/pomerantsev/accented/pull/147))

## 0.0.2

Initial preview release
