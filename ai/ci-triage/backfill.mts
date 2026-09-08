/**
 * One-time backfill: captures every failed run still within log retention.
 *
 * GitHub deletes run logs after roughly 90 days. Run *metadata* goes back much
 * further, so the manifest can document runs whose logs are already gone —
 * which is the only way to know later what was lost rather than skipped.
 *
 * Usage:
 *   node ai/ci-triage/backfill.mts          # dry run: print the plan
 *   node ai/ci-triage/backfill.mts --run    # actually capture
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type CaptureOutcome, capture, ghPaginate } from './capture.mts';

// ── Scope choices ───────────────────────────────────────────────────────────

const REPO_ROOT = resolve(import.meta.dirname, '..', '..');
const CAPTURES_DIR = resolve(REPO_ROOT, 'captures');

/** Every failed run considered, including ones deliberately skipped. This is
 *  what later answers "what did we choose not to capture, and was that right?" */
const MANIFEST_PATH = resolve(CAPTURES_DIR, 'manifest.json');

/**
 * What we capture, and why.
 *
 * Dependabot PR failures are the v1 scope: they sit untouched for weeks, so
 * triage does work that would otherwise be redone cold.
 *
 * `Accented` failures on main are own-commit failures — out of scope for
 * classification, but there are only four and they expire on the same clock.
 * Capturing costs minutes; not capturing forecloses ever widening scope.
 *
 * Excluded: `Scheduled` (~83 runs, all the same link-checker failure — as an
 * eval set it would be 90% of the data and teach the classifier to always
 * answer `flaky`) and `Dependabot Updates` (~83 runs of Dependabot's own
 * updater failing, which is not PR CI at all).
 */
function inScope(run: WorkflowRun): { include: boolean; reason: string } {
  if (run.head_branch?.startsWith('dependabot/')) {
    return { include: true, reason: 'dependabot PR failure' };
  }
  if (run.head_branch === 'main' && run.name === 'Accented') {
    return { include: true, reason: 'own-commit failure on main' };
  }
  return { include: false, reason: `out of scope: ${run.name} on ${run.head_branch}` };
}

// ── Types ───────────────────────────────────────────────────────────────────

interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  created_at: string;
  html_url: string;
  conclusion: string | null;
}

interface ManifestEntry {
  runId: number;
  createdAt: string;
  workflow: string;
  branch: string;
  headSha: string;
  url: string;
  decision: CaptureOutcome | 'skipped';
  reason: string;
  prNumber?: number | null;
}

// ── Run ─────────────────────────────────────────────────────────────────────

const execute = process.argv.includes('--run');

console.log('Enumerating failed runs…');
const { workflow_runs: runs } = ghPaginate<{ workflow_runs: Array<WorkflowRun> }>(
  'repos/{owner}/{repo}/actions/runs?status=failure',
  'workflow_runs',
);
console.log(`  ${runs.length} failed runs known to the API`);

const sorted = [...runs].sort((a, b) => a.created_at.localeCompare(b.created_at));
const planned = sorted.filter((run) => inScope(run).include);

console.log(`  ${planned.length} in scope, ${sorted.length - planned.length} out of scope`);
console.log(`  oldest in scope: ${planned[0]?.created_at ?? 'n/a'}`);
console.log(`  newest in scope: ${planned.at(-1)?.created_at ?? 'n/a'}`);

if (!execute) {
  console.log('\nDry run. Nothing fetched. Re-run with --run to capture.\n');
  for (const run of planned) {
    console.log(`  ${run.created_at.slice(0, 10)}  ${run.id}  ${run.name}  ${run.head_branch}`);
  }
  process.exit(0);
}

mkdirSync(CAPTURES_DIR, { recursive: true });

const manifest: Array<ManifestEntry> = [];
const tally: Record<string, number> = {};

for (const run of sorted) {
  const scope = inScope(run);
  const base = {
    runId: run.id,
    createdAt: run.created_at,
    workflow: run.name,
    branch: run.head_branch,
    headSha: run.head_sha,
    url: run.html_url,
  };

  if (!scope.include) {
    manifest.push({ ...base, decision: 'skipped', reason: scope.reason });
    tally.skipped = (tally.skipped ?? 0) + 1;
    continue;
  }

  const result = capture(run.id);
  manifest.push({
    ...base,
    decision: result.outcome,
    reason: result.reason ?? scope.reason,
    prNumber: result.prNumber ?? null,
  });
  tally[result.outcome] = (tally[result.outcome] ?? 0) + 1;

  const marker =
    result.outcome === 'captured' ? '✓' : result.outcome === 'skipped-existing' ? '·' : '✗';
  console.log(
    `${marker} ${run.created_at.slice(0, 10)}  ${run.id}  ${run.name.padEnd(18)} ${result.outcome}`,
  );
}

writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

console.log('\nDone.');
for (const [outcome, count] of Object.entries(tally).sort()) {
  console.log(`  ${outcome.padEnd(18)} ${count}`);
}
console.log(`\nManifest: ${MANIFEST_PATH}`);
