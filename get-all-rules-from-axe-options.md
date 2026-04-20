# `getAllRulesFromAxeOptions` — status and remaining work

## Known test failures

All current CI test failures on this branch are expected consequences of the gaps documented below and will be resolved when those gaps are closed:

- **Gap #2 (disabled-by-default rules)** is causing `color-contrast-enhanced` and `target-size` to run in WebKit when they should not. This produces spurious violations (e.g. on the `<a>` inside `#nested-interactive-outer`) that break three WebKit tests:
  - `console output › logs element groups with impact levels when there are 5 or fewer total issues` — extra violations push the count above 5, causing top-level groups to be logged
  - `rendering › triggers are rendered in the correct positions, and are all interactable` — the spurious element gets a trigger that fails alignment or interaction assertions
  - `rendering › trigger positions are updated on page resize` — same cause

- **`updateElementsWithIssues` interim approach** means stale ancestor-dependent violations on elements outside `limitedContext` are never cleared, which is why the `nested-interactive: issue disappears` e2e test fails on this branch.

## Goal

Accented's incremental scanner (PR #129) only re-scans elements affected by a DOM mutation, which means ancestor elements are never re-evaluated. Rules whose pass/fail depends on descendants (e.g. `page-has-heading-one`, `aria-required-children`) therefore go stale. The fix is a supplemental `axe.run()` on the full context using only those ancestor-dependent rules.

`getAllRulesFromAxeOptions(axeOptions)` is the utility that determines exactly which rules axe-core would run given a user's `runOnly` + `rules` configuration. Its output is then split into:
- **incremental rules** — all rules minus `ancestorDependentRules`
- **supplemental rules** — intersection with `ancestorDependentRules`

Both sets are passed to their respective `axe.run()` calls as `{ type: 'rule', values: [...] }`, so axe's own precedence logic no longer applies at run time.

## Current state

The function is implemented and unit-tested for these cases:

| Input | Behavior |
|---|---|
| No options | Returns all rules (via `axe.getRules()`) + applies `rules` overrides |
| `runOnly: { type: 'rule' }` | Returns `values` exactly; `rules` object ignored |
| `runOnly: { type: 'rules' }` | Same as above |
| `runOnly: { type: 'tag' }` | Returns tag-matching rules + applies `rules` overrides |
| `runOnly: { type: 'tags' }` | Same as above |
| `runOnly: string[]` / `TagValue[]` | Treated as tag values (see gap #1 below) |
| `runOnly: string` | Treated as a single tag value (see gap #1 below) |

Axe precedence rules verified via axe-core source (`ruleShouldRun`, `matchTags`, `normalizeOptions`) and `axe-options.spec.ts` (e2e) — though see gap #3 regarding the validity of those e2e tests.

## Gaps

### 1. String/array shorthand with rule IDs (bug)

When `runOnly` is a string or array, axe's `normalizeOptions` inspects each value: if any matches a known rule ID it normalises to `{ type: 'rule' }`, otherwise `{ type: 'tag' }`. Our implementation unconditionally treats all string/array shorthands as tags.

Consequence: `runOnly: 'color-contrast'` or `runOnly: ['color-contrast', 'button-name']` would return zero rules (no rule has those tag names) instead of the correct set. The `rules` object would also be incorrectly applied (it should be ignored for `type: 'rule'`).

Fix: replicate axe's detection using `axe.getRules()` to derive the full sets of known rule IDs and tag names, then route to the existing `type: 'rule'` or `type: 'tag'` code path accordingly.

### 2. Disabled-by-default rules in the no-options case (inaccuracy)

`axe.getRules()` returns all 104 rules, including 8 that axe disables by default (`aria-roledescription`, `audio-caption`, `color-contrast-enhanced`, `duplicate-id-active`, `duplicate-id`, `identical-links-same-purpose`, `meta-refresh-no-exceptions`, `target-size`). When there is no `runOnly`, axe skips these via a `rule.enabled !== false` check in `matchTags`. Our implementation includes them.

The `enabled` property is not exposed by `getRules()`. Fixing this accurately requires `axe._audit.rules` (an undocumented internal API). If we use it, we need e2e tests that will catch any axe-core version change that moves or renames it (see e2e section below).

Practical impact: both `axe.run()` calls use the normalized `{ type: 'rule', values: [...] }` form, which bypasses axe's own `rule.enabled` check. So any disabled-by-default rule incorrectly included in our set will be forced to run in whichever scan it lands in — either the incremental or the supplemental — when it should not run at all.

### 3. `axe-options.spec.ts` tests axe through Accented, not directly (wrong abstraction level)

The existing `axe-options.spec.ts` tests load the Accented-instrumented dev app and count `[data-accented]` elements. This means they test Accented's full pipeline — a bug in `getAllRulesFromAxeOptions` would not be caught, it would just be reflected in the output. What these tests should do instead is call `axe.run()` directly in the browser with specific `runOnly`/`rules` combinations and assert on the raw axe output, so any divergence between our implementation and axe's actual behavior surfaces immediately. This is especially important given that we may rely on `axe._audit` (an undocumented API) — direct axe tests act as a canary for axe-core version changes.

## Unit tests to add (`get-all-rules-from-axe-options.test.ts`)

For gap #1:
- `runOnly: 'color-contrast'` (single rule ID string) → returns `{ 'color-contrast' }`, `rules` ignored
- `runOnly: 'color-contrast'` with `rules: { 'button-name': { enabled: true }, 'color-contrast': { enabled: false } }` → still returns `{ 'color-contrast' }`, `rules` ignored
- `runOnly: ['color-contrast', 'button-name']` (array of rule IDs) → returns exactly those two rules
- `runOnly: ['color-contrast', 'button-name']` with `rules` overrides (enabled: true / false) → rules ignored
- `runOnly: ['best-practice', 'color-contrast']` (mixed tag + rule ID) → should throw (matching axe behaviour)

For gap #2:
- No options → disabled-by-default rules (e.g. `color-contrast-enhanced`) are absent from the returned set

## `updateElementsWithIssues` refactor (future work)

The function currently takes a single `(violations, scanContext)` pair. Its removal logic is: remove an element if it is in `scanContext` but absent from the new violations. With two scans having different contexts this breaks down:

- Using limited `scanContext` → stale ancestor-dependent violations on elements outside `scanContext` are never cleared.
- Using full `context` → stale non-ancestor-dependent violations on unscanned elements are incorrectly cleared.

### Correct algorithm

Pass both violation arrays, both contexts, and both rule sets into the function. For each tracked element, compute new combined issues as follows:

- Split existing issues into `existingIncrementalIssues` (ruleId not in `ancestorDependentRules`) and `existingSupplementalIssues` (ruleId in `ancestorDependentRules`).
- `newIncrementalIssues` = if element is in `scanContext` → what incremental violations say; otherwise → preserve `existingIncrementalIssues`.
- `newSupplementalIssues` = always what supplemental violations say (full context is always re-scanned).
- `newIssues` = `newIncrementalIssues` + `newSupplementalIssues`.

**Removal:** remove if not connected, or if `newIssues` is empty. This handles all cases correctly:
- Element outside `scanContext` with only incremental issues → `newIncrementalIssues` preserved → kept.
- Element outside `scanContext` with only ancestor-dependent issues → `newSupplementalIssues` always fresh → cleared when no longer violating.
- Element in `scanContext` with either type → both groups fresh → removed if both empty.

**Adding:** union of elements in either violations array not already tracked (no context check needed).

**Updating:** if `newIssues` differs from existing issues, update the issues signal.

### Interim approach

Initially, pass `scanContext` and merged violations (incremental + supplemental) to the unchanged function. This correctly adds and updates ancestor-dependent violations but does not clear stale ones for elements outside `scanContext`. Most existing e2e tests should continue to pass; the stale-clearing regression is a contained known issue to fix in a second pass.

## `callback` API — `scanContext` field needs review

The `callback` passed to `createScanner` currently receives a `scanContext` field describing what was scanned in that cycle. With a single `axe.run()` call this was unambiguous — it was the limited context of mutated nodes.

Now there are two scans with different contexts:
- The limited-context scan covers only the mutated nodes (filtered to the user-provided context).
- The full-context scan covers the entire user-provided context.

Passing only the limited context in `scanContext` is misleading: the consumer would think only those nodes were scanned, when in fact a broader scan also ran. Passing the full context is also misleading in the other direction.

**Needs review:** decide what `scanContext` should represent going forward — the limited context, the full context, both, or neither. It's possible the field should be removed or replaced with a more structured description of the two scans. The public API contract and any consumer-facing documentation should be updated accordingly.

## E2e tests to add (`axe-options.spec.ts`)

The existing e2e suite verifies our understanding of axe's `runOnly`/`rules` precedence. It should be extended to cover:

- `runOnly` as a rule ID string shorthand (e.g. `?run-only=color-contrast` where the value is a rule ID, not a tag)
- `runOnly` as an array of rule IDs (already partially covered by `run-only-rules`, but the shorthand path is different)

Additionally, **if we use `axe._audit`**, add a dedicated test that verifies the disabled-by-default rules are not included in our output. This test acts as a canary: if axe-core ever changes its internal structure, the test will fail and alert us to revisit the implementation.
