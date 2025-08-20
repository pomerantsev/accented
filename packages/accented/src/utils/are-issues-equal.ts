import type { Issue } from '../types.ts';

const issueProps: Array<keyof Issue> = ['id', 'title', 'description', 'url', 'impact'];

export function areIssuesEqual(issue1: Issue, issue2: Issue) {
  return issueProps.every((prop) => issue2[prop] === issue1[prop]);
}
