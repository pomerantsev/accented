import type { Issue } from '../types.ts';

const issueProps: Array<keyof Issue> = ['id', 'title', 'description', 'url', 'impact'];

export default function areIssueSetsEqual(issues1: Array<Issue>, issues2: Array<Issue>) {
  return issues1.length === issues2.length &&
    issues1.every(issue1 => Boolean(issues2.find(issue2 =>
      issueProps.every(prop => issue2[prop] === issue1[prop])
    )));
}
