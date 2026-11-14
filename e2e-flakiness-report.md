# E2E flakiness report: Dependabot PRs

Generated 2026-10-24 from the `Accented` workflow runs on `dependabot/*` branches.

## Runs

|                                                                         | Attempts |
| ----------------------------------------------------------------------- | -------- |
| Total (410 runs + manual re-runs)                                       | 429      |
| Failed because of e2e tests                                             | 24       |
| Failed for other reasons (Setup 40, unit tests 2, job never started 27) | 69       |
| Cancelled (60-min job timeout during the e2e step)                      | 4        |
| Passed                                                                  | 332      |

GitHub keeps logs and artifacts for about 90 days, so per-test data covers only the **112 attempts since 2026-07-28**: 90 passed, 18 failed on e2e, 4 timed out. Within that window there were **367 failed test attempts** in total.

## Failed attempts per test

Sorted by failed attempts. Each failed attempt counts, including those in runs that passed after a retry (max 3 attempts per test per run).
- **Runs affected:** attempts (out of 112) in which the test failed at least once.
- **Turned the run red:** attempts in which the test failed all 3 tries.

| #   | Failed attempts | Runs affected | Turned the run red | Test                                                                                                                                                                           | By browser project               |
| --- | --------------- | ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| 1   | 127             | 106           | 0                  | `main.spec.ts › Accented › mutations › removing an issue from an element with one issue results in one fewer elements with issues displayed`                                   | firefox 101, webkit 26           |
| 2   | 104             | 71            | 13                 | `main.spec.ts › Accented › rendering › sizes of Accented elements don’t fall below a certain threshold`                                                                        | webkit 104                       |
| 3   | 48              | 46            | 0                  | `with-colors.spec.ts › Accented › web platform support › shadow DOM › when an element is moved to a different shadow root, it gets a trigger that is aligned with the element` | firefox-dark 42, firefox 6       |
| 4   | 26              | 10            | 7                  | `main.spec.ts › Accented › performance › takes long to run with many elements with issues`                                                                                     | chromium 22, firefox 3, webkit 1 |
| 5   | 23              | 23            | 0                  | `main.spec.ts › Accented › API › context › selector array`                                                                                                                     | webkit 23                        |
| 6   | 12              | 12            | 0                  | `main.spec.ts › Accented › API › context › element`                                                                                                                            | webkit 12                        |
| 7   | 11              | 11            | 0                  | `main.spec.ts › Accented › API › context › node list`                                                                                                                          | webkit 11                        |
| 8   | 8               | 8             | 0                  | `main.spec.ts › Accented › API › context › selector`                                                                                                                           | webkit 8                         |
| 9   | 2               | 2             | 0                  | `main.spec.ts › Accented › API › context › shadow DOM selector`                                                                                                                | webkit 2                         |
| 10  | 2               | 1             | 0                  | `main.spec.ts › Accented › console output › logs the overall number of issues and elements with issues to the console`                                                         | firefox 2                        |
| 11  | 2               | 2             | 0                  | `main.spec.ts › Accented › performance › does not take long to run when one element is added to many elements with issues`                                                     | firefox 1, webkit 1              |
| 12  | 1               | 1             | 0                  | `main.spec.ts › Accented › API › callback › uses expected scan context`                                                                                                        | webkit 1                         |
| 13  | 1               | 1             | 0                  | `main.spec.ts › Accented › web platform support › if the issue is within a link, the link isn’t followed`                                                                      | webkit 1                         |

## Observations

- **The mutations test** fails at least once in 106 of 112 runs, but it has never turned a run red. It costs a retry in almost every run.
- **The sizes test (webkit)** and **the performance test (mostly chromium)** are the only tests that ever failed all three tries. That happened 20 times: 19 in the 18 e2e-failed runs (one run had two) and 1 in a run that later timed out. All of the sizes test's failures are timeouts, and so are all of the shadow-root test's (#3). The mutations, performance and `API › context` tests fail on assertions.
- **The `API › context` tests** fail only on webkit and only on their first attempt.
- **All 4 timed-out runs** (2026-09-24 to 09-26) hung mid-suite. Each one completed 315–317 of 331 tests and then went silent for about 50 minutes until the 60-minute job timeout. Test order is deterministic, and that position is the `[webkit] main.spec.ts › performance` tests. Playwright's own test timeout didn't fire. This is not the post-suite shutdown hang described in `playwright.config.base.ts`.

## Method

Per-test results come from the HTML report in each run's `e2e-results` artifact. They were cross-checked against two independent sources: the Playwright failure blocks in the job log, and the `test-results/*/error-context.md` files. All three sources agree exactly on all 108 runs that have a report. The 4 timed-out runs have no report, so their numbers come from `error-context.md` only. Tests are matched by file and title path, not line number.

## Root-cause analysis (added 2026-10-25)

How this was checked: besides the 112 historical runs above, the full suite was rerun on CI on throwaway branches with **retries off**, so every first-attempt failure counts. That was 8 parallel runs of the current code ("baseline") and 8 with the proposed test fixes. Then came a filtered round: the perf and console-output tests, 5 repeats × 10 jobs, so 50 samples per test per browser.

| Test                                                           | Baseline, trace off (8 runs) | Baseline, trace on (4 runs) | With fixes (8 runs) |
| -------------------------------------------------------------- | ---------------------------- | --------------------------- | ------------------- |
| mutations › removing an issue…                                 | firefox 7/8, webkit 2/8      | 0/4                         | 0/8                 |
| rendering › sizes… (webkit)                                    | 3/8                          | 1/4                         | 0/8                 |
| API › context › selector / selector array / node list (webkit) | 3/8, 3/8, 1/8                | 0/4                         | 0/8                 |
| shadow DOM › moved to a different shadow root (firefox-dark)   | 1/8                          | 0/4                         | not fixed yet       |

**Common cause #1: tests read the page before Accented's scan has finished.** Scans are async (throttle, then `axe.run`). Several tests count `[data-accented]` elements, or read an element's `data-accented` id, right after `page.goto()` or a click. Whether that works depends on how fast the browser is.
- Mutations test: it counts right after clicking "Add text to button", before the rescan removes the outline (`Expected: 47, Received: 48` every time).
- `API › context` tests: they count right after `goto`, before the first scan (`Received: 0`).
- Sizes test and "link isn't followed": the `getTriggerContainer()` helper reads `data-accented` before the element has it. It then waits 30 s for `accented-trigger[data-id="null"]`, which can never exist. That's why all of the sizes test's failures are timeouts. It navigates 3 times per test, so it often loses the race on retries too, which is how it turns runs red.

**Why these fail almost only on the first attempt:** `trace: 'on-first-retry'`. Tracing slows Playwright down enough for the scan to win the race. With trace on for every attempt, the mutations and context failures disappeared (0/4, versus 7/8 without trace). Retries mostly hide these bugs; they don't fix them.

**The 4 timed-out runs were the pnpm 12.6.0 post-suite hang, and it's already fixed.** All 4 ran on pnpm 12.6.0 before #603 (`gracefulShutdown: SIGTERM`) was merged on 2026-09-26. The 9 later runs on pnpm 12.6.0, after #603, didn't hang, and none of the 130 runs since then has hung. The claim above that the runs hung mid-suite after 315–317 tests isn't supported by the job logs or artifacts. The HTML reporter prints no progress, and a missing report is exactly what a hang during webServer teardown produces.

## Things to change

Performance tests ("takes long…", "does not take long… one element is added to many…") are tracked in #496 and left out of this list.

Sorted by failed test attempts (out of the 367 in the 112-run window) that wouldn't have happened with the fix. "Red" means runs that would have been green instead of failing. The proposed test changes are on the throwaway branch `flaky-investigation/fixes`. Its commits also contain investigation-only changes (CI workflow, test filters, an `EXPERIMENT` perf test), so only the test changes described here should be ported.
1. ✅ **Done in #643.** **In the mutations test "removing an issue…", wait for `#button-with-single-issue` to have `data-accented` before the initial count, and to lose it after the click, before the final count.**
   - **Helps:** #1 `mutations › removing an issue from an element with one issue…`. 127 failed attempts in 106 runs, 0 red.
   - **Confidence:** high. Verified on CI: 7/8 (firefox) and 2/8 (webkit) first-attempt failures went to 0/8.
   - **Context:** the trigger is removed together with the attribute, in the same DOM update, so `finalTriggerCount` is consistent once the attribute is gone. This test costs a retry in almost every run, so fixing it also shortens CI.

2. ✅ **Done in #643.** **In `test/helpers/trigger.ts` `getTriggerContainer()`, wait for the element to have `data-accented` before reading it (`await expect(locator).toHaveAttribute('data-accented')`).**
   - **Helps:** #2 `rendering › sizes of Accented elements…` (104 attempts, **13 red**) and #13 `if the issue is within a link…` (1 attempt). That's 105 attempts and 13 red runs. It also protects every other test that uses `getTriggerContainer()`, `openAccentedDialog()` or `expectElementStyles()`.
   - **Confidence:** high. Verified on CI: the sizes test went from 3/8 to 0/8. The failure signature (`data-id="null"`) can only come from reading the attribute too early.
   - **Context:** this covers 13 of the 18 red e2e runs in the window; the other red runs came from the "takes long…" perf test (see #496).

3. ✅ **Done in #643.** **In `API › context` (and `API › rules` / `runOnly`, which have the same pattern), wait for `page.locator('[data-accented]').first().waitFor()` after each `page.goto()` before counting.**
   - **Helps:** #5–#9: `context › selector array`, `element`, `node list`, `selector`, `shadow DOM selector`. 56 attempts, 0 red.
   - **Confidence:** high. Verified on CI: 3/8, 3/8 and 1/8 went to 0/8.
   - **Context:** waiting for the first highlighted element is enough. A scan applies all attributes in one synchronous DOM update, so once one is there, all of them are.

4. **In the shadow-root move test, await the click and replace `waitForTimeout(1200)` with an `expect.poll` that waits until the trigger for the element's _current_ `data-accented` id exists in the element's own root node; separately, make the task queue's leading run yield one microtask so that one DOM move reported by several shadow-root MutationObservers is scanned together.**
   - **Helps:** #3 `with-colors.spec.ts › shadow DOM › when an element is moved to a different shadow root…`. 48 attempts, 0 red.
   - **Confidence:** high for the test change; high that the library change is safe (clean CI regression run, below). The library change is a real improvement but isn't needed to remove the flake.
   - **Context:**
     - **Evidence:** a separate investigation ran in Docker with Playwright's Ubuntu image and CPU-limited containers to imitate CI runners; Playwright's Firefox wouldn't start on macOS.
       - It reproduced the exact CI error.
       - With the test change, failures went from 20/20 to 0/20 at 0.6 CPU, and from 5/30 to 0/30 at 1 CPU, with the library unchanged.
       - At full CPU, the race happened in every run, but only ~80–100 ms short of failing. - **Root cause (observed):**
       - After the move, the button keeps its old id (`42`), and trigger 42 stays in the _old_ shadow root until a later scan.
       - That scan gives the element a new id and trigger and deletes trigger 42.
       - The test reads the id once after a fixed wait. That wait starts before the click is even sent, because the click isn't awaited, so under load it often reads the stale id.
       - If the deleting scan lands between reading the id and `trigger.evaluate`, the test waits 30 s for a trigger that no longer exists: CI's signature. Otherwise it fails on alignment. - **Library bug (observed):**
       - Each shadow root has its own MutationObserver, so one move produces two callbacks: source root first, destination root second.
       - With `leading: true` and an idle queue, the first callback starts a scan straight away with only the source root.
       - The destination root waits a full throttle period (1000 ms) plus scan time.
       - The microtask yield in `TaskQueue.#preRun` made every post-move scan include both roots. All 89 unit tests pass with it.
       - On its own it didn't remove the flake (3/10 still failed at 1 CPU), because the test still reads too early. - **Why Firefox (inferred, not proven):** axe scans and Playwright input are slower there; Chromium fails the same way once CPU-limited. Why `firefox-dark` fails more than `firefox` was not established. - **Proposed test diff** (`with-colors.spec.ts`, the move test):
         ``ts
       await page
         .getByRole('button', { name: 'Move button to a container within a shadow root' })
         .click();
       const elementWithIssue = page.locator(`#button-in-shadow-dom${accentedSelector}`);
       // Until Accented handles the move, the element still carries the id of its old trigger,
       // which lives in the old shadow root and is removed by the next scan.
       await expect
         .poll(
           () =>
             elementWithIssue.evaluate((element, attrName) => {
               const id = element.getAttribute(attrName);
               const root = element.getRootNode() as Document | ShadowRoot;
               return root.querySelector(`accented-trigger[data-id="${id}"]`) !== null;
             }, accentedDataAttr),
           { timeout: 10000 },
         )
         .toBe(true);
       `` - **Proposed library diff** (`task-queue.ts`, `#preRun`):
         `ts
       if (this.#throttle.leading) {
         // Yield for one microtask so that items added in the same microtask checkpoint
         // (e.g. by several MutationObserver callbacks, one per shadow root, all reporting
         // a single DOM operation) are processed together in the leading run.
         await Promise.resolve();
       } else {
         await new Promise((resolve) => setTimeout(resolve, this.#throttle.wait));
       }
       ` - **Follow-ups:**
       - **(a) Clean regression run for the library change: done.** Both fixes ran together, on top of items 1–3, 5 and 6, on GitHub runners: 8 full-suite runs with retries off, 2,696 test results.
         - The only failures were the "takes long…" perf test (chromium 4/8, firefox 1/8). That's expected, since the perf tests weren't changed (see #496).
         - There were no other failures, including `mutation observer › causes a single scan…` and the console, callback and dialog tests. The earlier failures were caused by the investigation's debug logging.
         - The unit tests passed in all 8 jobs. - **(b) Both fixes together on GitHub runners: done.** The shadow-root move test passed in all 8 runs in every browser project. On its own that's weak evidence, because the unfixed test failed only 1/8 in the round-1 baseline (41% of runs historically). The strong evidence is the CPU-limited Docker reproduction above. - **(c) Alternative library fix: not done, and not needed.** It would mean dropping entries whose `element.getRootNode()` changed, in `updateElementsWithIssues`. - **(d) Audit of other tests: done; no other test is at risk.**
         - An element only gets a new id, which makes its old trigger stale, when its root node changes, because Accented identifies entries by `element` + `rootNode`.
         - The only other test that moves an element to a new root, "element with an issue moved from an iframe", has no trigger before the move, and item 2 covers its wait for the new id.
         - All other trigger tests keep the element in the same root, so its id is stable.

5. **In "logs the overall number of issues…", start `page.waitForEvent('console')` before `page.goto()`, and match only the summary with counts (`/\d+ accessibility issues? in \d+ elements?/`).**
   - **Helps:** #10 `console output › logs the overall number…`. 2 attempts, 0 red.
   - **Confidence:** medium. CI showed no failures in 150 runs (50 per browser), but the original failure is too rare to prove the fix.
   - **Context:**
     - The mechanism is clear: the listener is attached after `goto` resolves, so a scan that finishes before `load` is missed for good.
     - The stricter match is needed because Accented logs `No accessibility issues (Accented, …)` synchronously at startup. My first attempt, which only moved the listener, caught that message and failed 8/8.
     - The other console tests (`logs element groups…`, `logs top-level groups…`, page output, nested SVG, `<head>`) have the same listener-after-`goto` pattern and could get the same treatment, though they've never failed.

6. **In "uses expected scan context", replace the async `page.on('console')` handler plus `waitForTimeout(500)` with an awaited `page.waitForEvent('console')` registered before the click, then evaluate the args.**
   - **Helps:** #12 `API › callback › uses expected scan context`. 1 attempt, 0 red.
   - **Confidence:** medium.
   - **Context:** the failure (`jsHandle.evaluate: Test ended`) means the scan's console message arrived near the end of the 500 ms window, and the handler was still evaluating when the test ended. The fixed version passed in the full-suite CI runs, but this flake is too rare for 8 runs to prove anything.

## Further investigation

1. **No change needed for the hangs: keep `gracefulShutdown: SIGTERM` (#603). Optionally add a `list` or `dot` reporter next to `html` in CI.**
   - **Helps:** the 4 timed-out runs, already fixed (0 since 2026-09-26).
   - **Confidence:** high that they're fixed.
   - **Context:** with only the HTML reporter, a hung run leaves no trace of how far it got. A progress reporter would make any future hang easy to locate.

2. **Side finding, not a current flake: with `trace: 'on'`, about 10 console-related chromium tests fail every time.**
   - **Helps:** nothing today. It only matters if one of these tests ever fails its first attempt: the traced retries would then fail too and turn the run red.
     - **Confidence:** high that the behaviour is real (4/4 runs, both branches). Low on the cause; not investigated.
       - **Context:** affected tests include `console output › …`, `mutation observer › causes a single scan…`, `API › callback › elements with issues` and `throttle › leading: false`. They time out waiting for console events, or count the wrong number of messages.

3. **Library finding (not flakiness; for the backlog): misleading startup log.**
   - **Helps:** no flaky tests.
     - **Confidence:** high that the behaviour is real, from the logger source.
       - **Context:** the logger's `effect` runs immediately, so Accented logs `No accessibility issues` before the first scan has run. That's misleading for users, and it's what broke the first version of the item 5 fix.
