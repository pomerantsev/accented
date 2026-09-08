/**
 * Captures a single failed GitHub Actions run to disk.
 *
 * This is the only thing that produces a capture. The backfill calls it in a loop;
 * the archiver workflow will call it with one run ID from a `workflow_run` event.
 * Two callers, one implementation — captures from both eras must be identical.
 *
 * Usage: node ai/ci-triage/capture.mts <run-id>
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// ── Layout choices ──────────────────────────────────────────────────────────
// Every path and filename decision lives here. Nothing below invents a path.

/** Repo root, derived from this file's location (ai/ci-triage/ -> ../..). */
const REPO_ROOT = resolve(import.meta.dirname, '..', '..');

/** Where captures live. Bulk data, kept out of any package. */
const CAPTURES_DIR = resolve(REPO_ROOT, 'captures');

/** One directory per failed run: `2026-06-13-27458996510`. Date first so the
 *  listing sorts chronologically; run ID because it is globally unique and is
 *  the only link between a capture and an eval task promoted from it. */
const captureDirName = (createdAt: string, runId: number) => `${createdAt.slice(0, 10)}-${runId}`;

/** Verbatim GitHub API responses. We did not design these shapes and do not
 *  validate them — they are evidence, not an interface. `meta.json` (not yet
 *  written) will be a projection of these, and is the thing with a schema. */
const RAW_SUBDIR = 'raw';
const RAW_RUN = 'run.json';
const RAW_JOBS = 'jobs.json';
const RAW_PR = 'pr.json';
const RAW_FILES = 'files.json';

/** Extracted contents of the run's log archive, preserving its internal
 *  structure (`1_job-name.txt`, `job-name/system.txt`). Stored extracted rather
 *  than zipped: same bytes, but greppable and diffable, and git packs text well. */
const LOGS_SUBDIR = 'logs';

/** A capture is considered present if this file exists — used for idempotency. */
const PRESENCE_MARKER = join(RAW_SUBDIR, RAW_RUN);

// ── Types ───────────────────────────────────────────────────────────────────

export type CaptureOutcome =
  | 'captured'
  | 'skipped-existing'
  | 'expired' // logs past retention; nothing recoverable
  | 'failed'; // we did not get the artifact at all

export interface CaptureResult {
  runId: number;
  outcome: CaptureOutcome;
  dir?: string;
  /** Present for 'failed' and 'expired'. */
  reason?: string;
  /** How many open/closed PRs matched the branch. >1 means the branch was reused. */
  prCandidates?: number;
  prNumber?: number | null;
}

interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  created_at: string;
  conclusion: string | null;
}

// ── gh plumbing ─────────────────────────────────────────────────────────────

class GhError extends Error {
  readonly stderr: string;
  constructor(message: string, stderr: string) {
    super(message);
    this.stderr = stderr;
  }
}

/** All gh calls run from the repo root so `{owner}/{repo}` resolves from the remote. */
function gh(args: Array<string>): string {
  try {
    return execFileSync('gh', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const err = error as { stderr?: Buffer | string; message: string };
    throw new GhError(err.message, String(err.stderr ?? ''));
  }
}

/** Binary variant, for the log archive. */
function ghBinary(args: Array<string>): Buffer {
  try {
    return execFileSync('gh', args, { cwd: REPO_ROOT, maxBuffer: 256 * 1024 * 1024 });
  } catch (error) {
    const err = error as { stderr?: Buffer | string; message: string };
    throw new GhError(err.message, String(err.stderr ?? ''));
  }
}

function ghJson<T>(path: string): T {
  return JSON.parse(gh(['api', path])) as T;
}

/**
 * Fetches every page of a paginated endpoint and merges them.
 *
 * `gh api --paginate` concatenates raw JSON documents, which is invalid JSON on
 * any multi-page response. That failure is silent for single-page responses,
 * which is how it went unnoticed while testing against a 4-file PR.
 *
 * Handles both response shapes:
 *   - bare arrays (`/pulls/{n}/files`)          -> pass no collectionKey
 *   - objects wrapping an array (`/runs/{id}/jobs`) -> pass 'jobs'
 */
export function ghPaginate<T>(path: string, collectionKey?: string): T {
  const perPage = 100;
  const items: Array<unknown> = [];
  let envelope: Record<string, unknown> | undefined;

  for (let page = 1; ; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const body = ghJson<unknown>(`${path}${sep}per_page=${perPage}&page=${page}`);
    const batch = collectionKey ? (body as Record<string, unknown>)[collectionKey] : body;

    if (!Array.isArray(batch)) {
      throw new Error(
        `Expected an array at ${collectionKey ? `"${collectionKey}" in ` : ''}${path}, got ${typeof batch}`,
      );
    }

    if (page === 1 && collectionKey) {
      envelope = body as Record<string, unknown>;
    }
    items.push(...batch);

    if (batch.length < perPage) {
      break;
    }
  }

  return (collectionKey ? { ...envelope, [collectionKey]: items } : items) as T;
}

/** Pretty-printed for readable diffs. `gh api` returns compact JSON, and captures
 *  are excluded from biome, so nothing else will ever reformat these. */
function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Distinguishes "these logs are past retention" from "something went wrong".
 * GitHub returns **410 Gone** for expired run logs, not 404 — 404 is what you
 * get for a run ID that never existed. Both mean nothing is recoverable.
 */
function isGone(error: unknown): boolean {
  return error instanceof GhError && /HTTP 410|HTTP 404/i.test(error.stderr + error.message);
}

// ── Capture ─────────────────────────────────────────────────────────────────

/**
 * Captures one run. Never throws for conditions that are normal variation
 * (no PR, deleted branch, thin log archive) — those are recorded, not raised.
 * Only "we did not get the artifact" becomes a non-'captured' outcome, and even
 * then the caller's loop continues. The backfill cannot be allowed to abort:
 * logs expire, and a run skipped today may be unrecoverable tomorrow.
 */
export function capture(runId: number): CaptureResult {
  let run: WorkflowRun;
  try {
    run = ghJson<WorkflowRun>(`repos/{owner}/{repo}/actions/runs/${runId}`);
  } catch (error) {
    return {
      runId,
      outcome: 'failed',
      reason: `run.json unavailable: ${(error as Error).message}`,
    };
  }

  const dir = join(CAPTURES_DIR, captureDirName(run.created_at, runId));
  if (existsSync(join(dir, PRESENCE_MARKER))) {
    return { runId, outcome: 'skipped-existing', dir };
  }

  // The log archive is the only part that expires, so fetch it before writing
  // anything. Otherwise every pre-retention run leaves a capture directory with
  // metadata and no logs — worse than no directory, because it looks captured.
  let zip: Buffer;
  try {
    zip = ghBinary(['api', `repos/{owner}/{repo}/actions/runs/${runId}/logs`]);
  } catch (error) {
    return {
      runId,
      outcome: isGone(error) ? 'expired' : 'failed',
      reason: 'log archive unavailable',
    };
  }

  const rawDir = join(dir, RAW_SUBDIR);
  const logsDir = join(dir, LOGS_SUBDIR);
  mkdirSync(rawDir, { recursive: true });
  mkdirSync(logsDir, { recursive: true });

  if (!extractLogs(zip, logsDir)) {
    rmSync(dir, { recursive: true, force: true });
    return { runId, outcome: 'failed', reason: 'log archive would not extract' };
  }

  writeJson(join(rawDir, RAW_RUN), run);
  writeJson(
    join(rawDir, RAW_JOBS),
    ghPaginate(`repos/{owner}/{repo}/actions/runs/${runId}/jobs`, 'jobs'),
  );

  // Runs triggered by `push` carry an empty `pull_requests`, so the PR has to be
  // resolved from the branch name. A branch that has since been deleted, or a run
  // that was never on a PR, simply yields no pr.json / files.json.
  const owner = run.head_branch ? repoOwner() : '';
  let prNumber: number | null = null;
  let prCandidates = 0;

  if (run.head_branch && owner) {
    const head = `${owner}:${run.head_branch}`;
    const matches = ghPaginate<Array<{ number: number; created_at: string }>>(
      `repos/{owner}/{repo}/pulls?state=all&head=${encodeURIComponent(head)}`,
    );
    prCandidates = matches.length;
    if (matches.length > 0) {
      // Branch names get reused across reopens; take the most recent.
      const newest = [...matches].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      prNumber = newest ? newest.number : null;
    }
  }

  if (prNumber !== null) {
    writeJson(join(rawDir, RAW_PR), ghJson(`repos/{owner}/{repo}/pulls/${prNumber}`));
    writeJson(join(rawDir, RAW_FILES), ghPaginate(`repos/{owner}/{repo}/pulls/${prNumber}/files`));
  }

  return { runId, outcome: 'captured', dir, prNumber, prCandidates };
}

/** Unpacks the log archive, preserving its internal structure. */
function extractLogs(zip: Buffer, logsDir: string): boolean {
  const scratch = mkdtempSync(join(tmpdir(), 'ci-capture-'));
  const zipPath = join(scratch, 'logs.zip');
  try {
    writeFileSync(zipPath, zip);
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', logsDir], { maxBuffer: 64 * 1024 * 1024 });
    return true;
  } catch {
    return false;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

let cachedOwner: string | undefined;
function repoOwner(): string {
  if (cachedOwner === undefined) {
    cachedOwner = ghJson<{ owner: { login: string } }>('repos/{owner}/{repo}').owner.login;
  }
  return cachedOwner;
}

// ── CLI ─────────────────────────────────────────────────────────────────────

if (process.argv[1] === import.meta.filename) {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node ai/ci-triage/capture.mts <run-id>');
    process.exit(1);
  }
  const result = capture(Number(arg));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.outcome === 'failed' ? 1 : 0);
}
