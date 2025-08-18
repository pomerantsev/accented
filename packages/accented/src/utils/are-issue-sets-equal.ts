import type { Issue } from '../types.ts';
import { areIssuesEqual } from './are-issues-equal.js';

export function areIssueSetsEqual(issues1: Array<Issue>, issues2: Array<Issue>) {
  return (
    issues1.length === issues2.length &&
    issues1.every((issue1) => Boolean(issues2.find((issue2) => areIssuesEqual(issue1, issue2))))
  );
}
