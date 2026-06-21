# accented

## 1.4.0

### Minor Changes

- Bump axe-core to 4.12.1 ([#524](https://github.com/pomerantsev/accented/pull/524), [#531](https://github.com/pomerantsev/accented/pull/531))
  (warrants a minor change since [at least one new rule is introduced](https://github.com/dequelabs/axe-core/blob/e841a337ab53859a0b0b6638cce5bd1c2c901b52/CHANGELOG.md#4120-2026-06-01), affecting audits)

### Patch Changes

- Fix: remove usage of the undocumented axe-core `axe._audit` API ([#524](https://github.com/pomerantsev/accented/pull/524))

### Dependencies

- axe-core 4.12.1 (see Minor Changes)

- @preact/signals-core 1.14.3 ([#532](https://github.com/pomerantsev/accented/pull/532))

## 1.3.2

### Patch Changes

- Fix: scan would run on the full document if a mutation happened outside of context ([#514](https://github.com/pomerantsev/accented/pull/514))

## 1.3.1

### Patch Changes

- Fix positioning of triggers on transformed elements in Safari TP ([#507](https://github.com/pomerantsev/accented/pull/507))

### Dependencies

- axe-core 4.11.4 ([#509](https://github.com/pomerantsev/accented/pull/509))

- @preact/signals-core 1.14.2 ([#500](https://github.com/pomerantsev/accented/pull/500))

## 1.3.0

### Minor Changes

- Fix false positives and false negatives for some axe-core rules ([#482](https://github.com/pomerantsev/accented/pull/482))
  **Important:** this fix _might_ lead to a slight decrease in runtime performance on complex pages.

### Dependencies

- axe-core 4.11.3 ([#491](https://github.com/pomerantsev/accented/pull/491))

### Build

- typescript 6.0.3 ([#480](https://github.com/pomerantsev/accented/pull/480))

## 1.2.6

### Dependencies

- axe-core 4.11.2 ([#469](https://github.com/pomerantsev/accented/pull/469))

- @preact/signals-core 1.14.1 ([#471](https://github.com/pomerantsev/accented/pull/471))

### Build

- typescript 6.0.2 ([#474](https://github.com/pomerantsev/accented/pull/474))

## 1.2.5

### Dependencies

- @preact/signals-core 1.14.0 ([#451](https://github.com/pomerantsev/accented/pull/451), [#461](https://github.com/pomerantsev/accented/pull/461))

## 1.2.4

### Patch Changes

- Fix positioning of Accented triggers on transformed elements in Chrome 144+ ([#443](https://github.com/pomerantsev/accented/pull/443), [#445](https://github.com/pomerantsev/accented/pull/445))

### Dependencies

- @preact/signals-core 1.12.2 ([#436](https://github.com/pomerantsev/accented/pull/436))

## 1.2.3

### Dependencies

- axe-core 4.11.1 ([#416](https://github.com/pomerantsev/accented/pull/416))

## 1.2.2

### Patch Changes

- Fix: mitigate an axe-core bug that could prevent shadow roots from being scanned ([#369](https://github.com/pomerantsev/accented/pull/369))

## 1.2.1

### Patch Changes

- Fix: passing a `context` object with missing `include` led to unexpected and incorrect scan context ([#361](https://github.com/pomerantsev/accented/pull/361))

### Build

- TypeScript target: ES 2024 ([#362](https://github.com/pomerantsev/accented/pull/362))

## 1.2.0

### Dependencies

- axe-core 4.11.0 (minor upgrade) ([#347](https://github.com/pomerantsev/accented/pull/347))

### Build

- typescript 5.9.3 ([#331](https://github.com/pomerantsev/accented/pull/331))

## 1.1.2

### Patch Changes

- Fix some edge cases in ShadowDOMAwareMutationObserver ([#300](https://github.com/pomerantsev/accented/pull/300))

### Dependencies

- @preact/signals-core 1.12.1 ([#301](https://github.com/pomerantsev/accented/pull/301))

## 1.1.1

### Patch Changes

- Remove an improper use of the axe-core trademark from the Accented dialog ([#283](https://github.com/pomerantsev/accented/pull/283))

## 1.1.0

### Minor Changes

- Make console output a lot more user-friendly ([#268](https://github.com/pomerantsev/accented/pull/268))

- Add `output.page` option to support console-only mode ([#268](https://github.com/pomerantsev/accented/pull/268))

### Build

- typescript 5.9.2 ([#252](https://github.com/pomerantsev/accented/pull/252))

## 1.0.1

### Patch Changes

- Fix trigger positioning in Safari Technology Preview ([`f503408`](https://github.com/pomerantsev/accented/commit/f503408d59f47d5b2f9737d058ad7a61213dea1a))

### Dependencies

- @preact/signals-core 1.11.0 ([#214](https://github.com/pomerantsev/accented/pull/214))

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

### Dependencies

- axe-core 4.10.3 ([#147](https://github.com/pomerantsev/accented/pull/147))

### Build

- typescript 5.8.3 ([#147](https://github.com/pomerantsev/accented/pull/147))

## 0.0.2

Initial preview release
