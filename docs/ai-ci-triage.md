# AI-assisted CI failure triage

_Last updated: 2026-09-07_

## Goal

Cut the time spent working out why an automated PR's CI run failed, and learn how to
build and evaluate AI automation on a project that real people depend on.

The system reads a failed CI run and posts a comment saying what actually broke and what
to do about it. It is **read-only**: it never edits code, never pushes commits, never
merges, never re-runs jobs.

The second goal carries equal weight: learn what an eval actually is by building one. The
classifier is small enough to be a good vehicle for that.

## Why not auto-fix

The obvious version of this idea is an agent that pushes a fix until CI goes green. The
evidence says don't. At the time of writing, all three long-open failing Dependabot PRs
wanted **no code change at all**:

- **#569** (`changesets/action 1→2`) — flaky Playwright webkit/firefox timeouts, on a PR
  that only touches a workflow file. Correct action: re-run.
- **#576** (`typescript 6→7`) — `astro check` refuses TypeScript 7 outright; blocked
  upstream. Correct action: add the blocked range to `.github/dependabot.yml` → `ignore`
  with the upstream issue linked, and close the PR.
- **#575** (`biome`) — a missing Dependabot-scoped token. Correct action: fix repo config.

Three for three, an auto-fixer would have had a chance to do damage (most plausibly by
weakening test assertions or bumping timeouts in an accessibility library) and no chance
to help. Classification is also far easier to evaluate than a fix, which matters given
the learning goal.

## Shape

- **One Messages API call** with a structured output. Not an agent loop, not
  `claude-code-action`. Simplest tier that does the job, and the only one that's cheap to grade.
- **Do not install the Claude GitHub App.** Its permission set is all-or-nothing and wide
  (Contents/Workflows/Actions read-write). Use an `ANTHROPIC_API_KEY` secret plus the
  built-in `GITHUB_TOKEN`; comments post as `github-actions[bot]`.
- **Categories:** `flaky` / `upstream-blocked` / `infra-config` / `genuine-breakage` /
  `unknown`. Output carries the category, a verbatim error excerpt, a recommended action,
  and a confidence. `unknown` is a valid answer, not a failure.
- **Category and action are separate concerns.** The category is *reading* — derivable
  from the log, and it generalises. The recommended action is *house policy* — not
  derivable from anything, and it comes from `ai/ci-triage/conventions.md`, a markdown
  file pasted into every prompt. The model should invent as little of the action as
  possible; the more it comes from the conventions file verbatim, the more predictable
  the system is and the cheaper corrections get.
- **Sticky PR comment**, updated in place. No labels — they go stale and start lying once
  a run is retried.
- **Lives in `/ai/`** at the repo root: a standalone pnpm project with its own lockfile,
  outside the `packages/*` workspace. Keeps the Anthropic SDK out of the five existing
  workflows, needs no `.changeset/config.json` entry, and lets the triage job install in
  seconds instead of pulling the whole monorepo to make one API call.
- **Scoped to Dependabot PR failures** for v1. Those sit untouched for weeks, so the
  triage is doing work that would otherwise be redone cold.
- **Must never make CI redder.** `continue-on-error: true`; any failure means no comment
  rather than a red X. There's already enough alert fatigue from the nightly link checker.
- **Cost:** roughly $0.02/call on Haiku 4.5, $0.07 on Sonnet 5. Production spend is
  pennies a month; eval sweeps dominate. Comfortably under $5/month.

## Plan

1. **Capture the logs.** GitHub deletes run logs after ~90 days and the dataset is
   shrinking daily. Backfill what's retrievable now, then land an archiver so it never
   matters again.
2. **Label.** Turn ~15–25 captured incidents into eval tasks with hand-written expected
   answers. Done by hand, cold, without pre-filled suggestions.
3. **Build the classifier and the eval harness together.** Prompt, schema, extraction, and
   a runner that scores the prompt against the labelled tasks.
4. **Ship the workflow.** `workflow_run: completed` → classify → sticky comment. The
   disclosure (below) lands in the same PR as the first `ai/` code, not later.
5. **Iterate.** Read the transcripts where it's wrong. Expect some of those to be bad
   labels rather than bad answers — that's the main lesson on offer.

## Correcting it when it's wrong

Nothing here learns on its own. The model has no memory between runs; every classification
starts cold from the same text. Steering it means editing files that are committed to the
repo — which is the point. The behaviour is fully inspectable and fully under version
control.

A disagreement lands in one of three places:

1. **`ai/ci-triage/conventions.md`** — when the *category* was right but the *action* was
   wrong. Most corrections are this, and they're a two-line edit. The #576 case above is
   the archetype: `upstream-blocked` was correct, "hold the PR" was not, and no amount of
   log-reading could have produced the right answer because it's policy.
2. **The prompt** — when the reasoning was wrong (a genuine breakage called `flaky`).
   Rarer, and riskier: prompt edits are not local and have side effects on cases you
   weren't thinking about.
3. **The eval set** — *always*, whichever of the above you fixed.

That third step is the one that's easy to skip and shouldn't be. Adding the label changes
no behaviour at all; it changes the score. Its value shows up on the *next* prompt edit,
months later, when sharpening one thing quietly breaks something fixed long ago. **The
eval set is the regression test suite for prompt edits, and it gets built out of
disagreements.** Every time the system is wrong and gets corrected, that also produces the
test that stops it being wrong the same way again.

The loop, end to end:

```
it's wrong  →  pnpm ai:promote <run-id>   (capture → eval task + blank expected.json)
            →  write the expected answer by hand        (~2 min)
            →  edit conventions.md, or the prompt
            →  pnpm ai:eval                             (fixed this one? broke the others?)
            →  commit
```

Roughly fifteen minutes, most of it the edit. Step five is the part unobtainable any other
way — without it, prompt editing is guesswork.

Keep the promote step manual for now. A 👎 reaction on the sticky comment that auto-opens a
PR adding the task is a good idea, but at ~10 failures a month it's more machinery than the
event rate justifies, and it's strictly additive later.

## When the evals run

**On pull requests touching `ai/**`. Three trials per task. Informational, not gating.**

- **Path filter, not every PR.** The score can only move if an input to the classifier
  moves, and every one of those — prompt, `conventions.md`, extraction, output schema,
  pinned model ID, task set — lives under `ai/`. A website CSS change cannot alter the
  result, so running there spends real money to reprint the same number. It's an honesty
  argument more than a cost one: a check that can't fail trains you to ignore checks.
- The filter also covers the case that would otherwise be missed: **a Dependabot bump of
  the Anthropic SDK inside `ai/` is a PR touching `ai/**`**, so the sweep runs against the
  new SDK with no extra wiring.
- **Three trials, because one measures the model's mood as much as the prompt.** Identical
  prompt and input do not guarantee an identical answer. Three gives `pass^3` — right all
  three times — which is the number that matters for a classifier meant to run unattended.
  A task passing 1-of-3 is not a pass; it's a coin flip that landed well.
- **No nightly cron.** The usual justification is catching silent model drift, which only
  applies if the pinned model ID is an alias that can be repointed (see open question 8).
  If it's an immutable snapshot, a cron buys nothing but a monthly bill and run-to-run
  variance that's easy to misread as drift. If it *is* an alias, monthly is cheap
  insurance — nightly still isn't.
- **The tight loop is local.** `pnpm ai:eval` while editing the prompt, no CI round trip.
  The workflow is the backstop for the 1am edit that never got checked — which is the
  entire reason it's automatic rather than something to remember.
- **Cost per sweep:** ~25 tasks × 3 trials = 75 calls, roughly $1.70 on Haiku 4.5 and $5 on
  Sonnet 5, halved again if routed through the Batch API. Only fires on `ai/**` PRs, of
  which there will be a handful a month.

## Disclosure: stating the AI position

Nothing AI-related merges to `main` without this shipping alongside it. `/ai/` will appear
in the repo root listing, and the root README's "In this monorepo" inventory would be
conspicuously silent about it. A reader finding it unannounced is a far worse first
impression than one who read the statement first.

Three claims. **Scope is decided:** it includes AI-assisted authoring of library code, not
just the CI automation. They are different in kind and should be written differently:

1. **No AI in the library, and none planned.** Verifiable and falsifiable, so state it in
   checkable form: two runtime dependencies (`axe-core`, `@preact/signals-core`), no
   network calls, no API key, works offline, same input → same output. Could be enforced by
   a test rather than merely asserted. "None planned" is a commitment about the future —
   which is precisely what makes it worth stating.
2. **AI coding tools are used, with a human always in the loop.** Unverifiable, so it earns
   trust through **specificity, not hedging**. Vague reassurance reads defensively; a plain
   statement that the maintainer reviews and is accountable for everything that ships does
   not.
3. **AI-based automation runs in CI** — write this as an **invariant, not an inventory.**
   An enumeration of current workflows goes stale the moment a second one lands, and then
   either needs constant editing or quietly drifts out of true. A boundary does not:

   > AI-based automation runs in this repository's CI. It is limited to reading and
   > reporting — it may analyse a failed build and post a comment about what it found. It
   > does not write code, push commits, merge pull requests, or publish releases.

   Adding another read-only workflow then requires no edit. Adding one that writes code
   *forces* an edit — the right forcing function. The page stops being maintenance and
   becomes a constraint on what gets shipped.

### What the concern actually is

The accessibility community's distrust here is not generic anti-AI sentiment. It is
specific, and earned: years of **automated accessibility remediation** — overlay widgets
claiming to fix a11y with AI. Accented is adjacent enough to that space that "does this
guess at issues, or at fixes?" is a reasonable question to arrive with. Answer *that*
rather than staking out a position on AI in general. The answer is strong: deterministic
axe-core rules, no model anywhere in the detection path.

### Where it goes

**A dedicated page and a footer link — nowhere else on the site.** Spreading it across
about / how-it-works / root README reads as protesting too much for what should be a
matter-of-fact disclosure.

- **`packages/website/src/pages/use-of-ai.mdx`** — new page at `/use-of-ai`, holding all
  three claims. Model it on `privacy.mdx`, not `about.mdx`: `layout:
  ~/layouts/DocsLayout.astro`, no `<TableOfContents />`, short sections, optional contact
  line. Same register, same length.
- **`packages/website/src/layouts/MainLayout.astro`** — the footer is a flat stack of
  `<p>` elements (currently: attribution, axe-core trademark, Privacy). Add
  `<p><a href="/use-of-ai">Use of AI</a></p>` directly after the Privacy line.
- **`packages/accented/README.md`** — **claim 1 only**, one sentence under "What is
  Accented?", linking to the page. This is a genuinely separate surface: the npm package
  page shows none of the site's chrome, so the footer link is invisible there, and npm is
  where the install decision actually gets made.

Nothing in `about.mdx`, `how-it-works.mdx`, or the root README.

### Tone

Short, plain, first person. The failure mode is a manifesto — a defensive essay reads as
having something to defend. No general argument for or against AI; just what is true about
this project. Note that `about.mdx` currently uses "we"; for the *responsibility* claim,
first-person singular is stronger, since "we take responsibility" from a solo-maintained
project is weaker than "I do."

### The obligation it creates

Publishing "AI never writes code in this repo" is a commitment, not a one-off. If an
auto-fixer or any code-writing workflow ever ships, the statement changes with it —
otherwise it quietly becomes false. So: describe the **current** boundary, keep the wording
cheap to amend, and make updating it part of shipping any future AI workflow.

## Deliberately out of scope

- **Changeset automation for Dependabot PRs.** The rule is fully deterministic across
  every merged PR checked: add a changeset iff the bump touches
  `packages/accented/package.json` → `dependencies`, severity mirroring the dep's own
  semver bump. That's a ~30-line script in `.github/`, and an LLM would be slower and less
  reliable. Worth doing; not part of this.
- **The nightly link checker.** `Scheduled` has failed nearly every night for months. It
  needs an engineering fix (retry on 5xx, host allowlist, or make `--live` non-blocking),
  not AI. It's also excluded from the eval set: at ~190 runs of one failure mode it would
  be 90% of the data and teach the classifier to always answer `flaky`.
- **Re-checking the Dependabot `ignore` list.** Once a version range is ignored for an
  upstream reason, something should periodically check whether the blocker has cleared and
  the entry can go. That's a scheduled job that attempts the install and reports — no AI
  involved. Worth doing; different project.
- **Failures on your own commits.** Only a handful survive in log retention, so there's no
  way to measure quality on them. The trigger can be widened later if flake detection
  proves accurate — that's a config change, not a redesign.

## Open questions

### Needs a decision before building

1. **Confirm `/ai/` at the repo root.** Proposed and reasoned through (see appendix), but
   never explicitly agreed. The alternative considered and rejected was `tools/ai/` — the
   `tools/` level would have had exactly one occupant, since every existing script in this
   repo is package-scoped and belongs where it is.
2. **Are the five categories right?** `flaky` / `upstream-blocked` / `infra-config` /
   `genuine-breakage` / `unknown` were derived from three examples. Years of real failure
   history may say otherwise — a wrong or incomplete category set poisons every label made
   against it, and relabelling later is the expensive kind of rework.
3. **Sequencing: archiver before labelling?** The dataset shrank from ~25 to ~15 distinct
   incidents in a week. That inverts the earlier suggestion to label immediately: landing
   the archiver first and letting the set grow may beat labelling a thin one now.
4. **Capture non-Dependabot failures too?** Capture is cheap and reversible; labelling is
   the expensive part. Capturing everything now preserves the option to widen scope later
   without waiting out another 90 days.
5. **Do the changeset script first?** #567 has been open since 15 August needing only a
   changeset. The deterministic script is an afternoon's work and unblocks it immediately.
   It is not AI work, but it is the thing currently costing time.
_(Resolved: the disclosure's scope — see the Disclosure section. It covers AI-assisted
authoring of library code, not only the CI automation.)_

### Settle later, on evidence

6. **Haiku 4.5 vs Sonnet 5** — decide on the eval set, not by guessing.
7. **Should the eval score ever gate a PR?** Start informational; a non-deterministic
   required check is just another flaky job.
8. **Is the pinned model ID an immutable snapshot or a moving alias?** Verify against the
   API docs before deciding whether a low-frequency scheduled eval run has any purpose. If
   snapshots, there is no drift to catch and the answer is no cron at all. If aliases, a
   monthly run is worth its cost. Cheap to check; don't guess.

---

# Step 1 in detail: capture the logs

This is the only part with a deadline. Everything else can wait; expired logs cannot be
recovered, and a log that no longer exists can never become a test case.

## Two artifacts, not one

**Captures** are automatic, high-volume and unfiltered. **Eval tasks** are curated and
labelled. Conflating them means the eval set fills with link-checker noise.

- Captures live on an orphan branch, `ci-captures`. Free, versioned, and never touches
  `main`'s history or triggers CI.
- Promoted eval tasks live on `main`, in `ai/ci-triage/evals/tasks/`. They're test
  fixtures and belong beside the code that reads them; that also keeps the eval runnable
  in CI with no extra auth or network.

A `pnpm ai:promote <run-id>` script moves one across and drops a blank `expected.json`
stub. The orphan branch is never hand-managed.

## Capture before extraction, not after

Store the log roughly as GitHub returns it. If the archiver stored the *cleaned* log,
`extract.ts` would sit outside the eval loop and a change to it could never be measured —
the original input would be gone. Extraction runs inside `classify()`, where the evals can
see it.

So: capture generously and bluntly; extract tightly and testably at classify time.

## What a capture contains

```
captures/2026-08-29-33238587845/
  meta.json
  log.txt
```

`meta.json` carries run ID and URL, workflow and failing job name, branch, PR number and
title, conclusion, timestamp, whether it was a re-run, and — critically — **the list of
changed file paths**. Without that, #569 is unlabelable by anyone: the only reason "flaky"
is deducible is that the PR touches nothing but `.github/workflows/accented.yml`, and a
workflow-file edit cannot cause a webkit timeout.

`log.txt` is the failed-job log with provably-useless lines stripped (git credential
cleanup, runner provisioning, `##[group]` markers) and capped at ~150 KB, keeping head and
tail with an explicit elision marker. Measured sizes: 18 KB for a short config failure,
49 KB for a typecheck failure, 246 KB for a Playwright run with retries.

## Deduplication

Three workflows (Accented, Website, Playground) fail together on a single push. That is
**one incident**, not three. Key captures by triggering commit SHA, and keep the log of
each distinct failing job.

## Order of work

1. A backfill script that walks retained failure runs, dedupes by commit, writes captures,
   and pushes them to `ci-captures`. Run once, locally, now.
2. `archive-ci-logs.yml` — `workflow_run: completed`, same capture logic, so the clock
   stops mattering.
3. `pnpm ai:promote <run-id>`, plus a report of captured-but-unlabelled incidents so the
   backlog surfaces itself instead of needing to be remembered.

## Test coverage

`capture.mts` and `backfill.mts` get unit tests, running with the rest of the unit suite —
Node's built-in runner handles `.mts` natively, so `node --test 'ai/**/*.test.mts'` needs no
new dependency. `/ai/` is outside the workspace, so root's `test:unit` cannot reach it via
`--filter`; it's appended as a second command in that script, which puts it in
`accented.yml` with no separate workflow.

**Written after the backfill runs, not before.** The backfill is the best available source
of test fixtures: 158 real runs surface response shapes that are hard to invent — deleted
branches, thin log archives, missing PRs. Tests written first would encode guesses about
what GitHub returns; tests written after use captured responses. Same argument as labels
before categories.

Priority order, because it inverts what the manual testing covered:

1. **`ghPaginate` across multiple pages**, both response shapes. This is the one path that
   was rewritten and has still only ever run against single-page responses — and this repo
   is unlikely to exercise it, since Dependabot PRs touch few files and runs have two jobs.
   Most likely to be wrong, least likely to be caught by use.
2. `isGone` — 410 vs 404 vs a network error.
3. The expired path writes nothing to disk.
4. The no-PR / deleted-branch path degrades rather than throwing.
5. `captureDirName`.

Verified manually against real data, so not the priority: live capture, `expired` on 410,
idempotent skip, PR resolution by branch, log extraction, `files.json` contents.

## Current state

As of 2026-09-07: **36 Dependabot failure runs** still within retention (down from 52 a
week earlier), roughly 15 distinct incidents after deduplication. That's below the 20–50
range worth aiming for, which is an argument for landing the archiver promptly and letting
the set grow rather than waiting to start.

---

# Appendix: repo constraints found

Verified by inspection on 2026-09-07. These are the findings that drove the placement and
tooling decisions above; re-check them if the repo's wiring changes.

- **`.changeset/config.json` has an `ignore` list.** Every workspace member must be either
  published or listed there. Since `pnpm-workspace.yaml` globs `packages/*`, any new
  directory under `packages/` becomes a workspace member automatically and **must** be
  added to `ignore` or `changeset version` breaks the release. This is the single biggest
  reason `/ai/` sits outside the workspace with its own lockfile.

- **`.github/actions/setup` runs `pnpm install` and `pnpm biome check` on every job**,
  across all five workflows. `actions/setup-node@v6` is configured **without** its `cache`
  input, so every install is cold. A triage job inside the root workspace would install the
  entire monorepo — astro, playwright, sharp, netlify-cli — to make one API call.

- **Root `package.json` scripts are explicit `--filter` lists.** A new package would *not*
  automatically join `build`, `test:unit` or `test:e2e`. Low blast radius on scripts;
  the cost is all in install time and changesets.

- **Biome skips `.log` files cleanly** despite `files.ignoreUnknown: false` — verified by
  probe, so committed log fixtures are safe. It *does* format-check `.json`, so
  hand-written `expected.json` labels get reformatted by the `lint-staged` pre-commit hook.
  Harmless, but expect the diff.

- **Node 24.2 strips TypeScript natively** in this environment (with an experimental
  warning). No build step and no `tsx` needed — a `.ts` file runs directly. The repo
  already relies on this: `node ./scripts/copy-common.ts`, `node --test --import tsx`.

- **`pnpm-workspace.yaml` sets `minimumReleaseAge: 4320` (3 days) with
  `minimumReleaseAgeStrict: true`**, excluding only `accented`. New dependencies are held
  for three days. Applies to anything in the root workspace.

- **Log retention is ~90 days.** Confirmed by probe: a run from 2026-04-19 returns nothing;
  2026-06-16 still resolves. Run *metadata* goes back to July 2025, but the logs — the part
  worth labelling — do not.

- **Measured log sizes** (failed-job logs, before extraction): 18 KB for a config failure
  (48% boilerplate), 49 KB for a typecheck failure (26%), 246 KB for a Playwright run with
  retries (6% — the bulk there is real test output, so boilerplate stripping barely helps).

- **The changeset rule for Dependabot PRs is fully deterministic** across all 20 merged PRs
  checked: add a changeset iff the bump touches `packages/accented/package.json` →
  `dependencies` (currently `axe-core`, `@preact/signals-core`); severity mirrors the dep's
  own semver bump; body is `Bump <dep> to <version>`. Dev, website, playground, biome and
  github-actions bumps get nothing — 17 of 20 merged PRs. One historical exception
  (`Bump typescript to 6.0.3 (no functional changes)`) and one manual override
  (`Bump to minor because of the performance decrease`).
