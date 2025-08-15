import { effect } from '@preact/signals-core';
import { accentedUrl, orderedImpacts } from './constants.js';
import { elementsWithIssues, enabled } from './state.js';
import type { ElementWithIssues, Issue } from './types.ts';

const MAX_ISSUES_BEFORE_OUTPUT_COLLAPSE = 5;

const defaultStyle = 'font-weight: normal;';

// TODO: move to constants
const colors = {
  minor: 'light-dark(oklch(0.45 0 0), oklch(0.8 0 0))',
  moderate: 'light-dark(oklch(0.45 0.16 230), oklch(0.8 0.16 230))',
  serious: 'light-dark(oklch(0.45 0.16 90), oklch(0.8 0.16 90))',
  critical: 'light-dark(oklch(0.45 0.16 0), oklch(0.8 0.16 0))',
};

const impactText = (impact: Issue['impact']) => impact.charAt(0).toUpperCase() + impact.slice(1);

const titleAndUrl = (issue: { title: Issue['title']; url: Issue['url'] }) =>
  `${issue.title} ${issue.url}`;

// This sorting is not ideal since it doesn't work very well with shadow DOM.
const sortByElementPositions = (
  a: ElementWithIssues['element'],
  b: ElementWithIssues['element'],
) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1);

type IssueType = {
  title: Issue['title'];
  url: Issue['url'];
  impact: Issue['impact'];
  elements: Array<{ element: ElementWithIssues['element']; description: Issue['description'] }>;
};

type GroupedByIssueType = Record<string, IssueType>;

const getIssueTypeGroups = (elementsWithIssues: Array<ElementWithIssues>) => {
  const groupedByIssueType = elementsWithIssues.reduce((acc, { element, issues }) => {
    for (const issue of issues) {
      if (!acc[issue.id]) {
        acc[issue.id] = {
          title: issue.title,
          url: issue.url,
          impact: issue.impact,
          elements: [],
        };
      }
      acc[issue.id]?.elements.push({ element, description: issue.description });
    }
    return acc;
  }, {} as GroupedByIssueType);

  const sorted = Object.values(groupedByIssueType).sort((a, b) => {
    const impactComparison = orderedImpacts.indexOf(b.impact) - orderedImpacts.indexOf(a.impact);
    if (impactComparison !== 0) {
      return impactComparison;
    }
    return b.elements.length - a.elements.length;
  });

  return sorted;
};

function logIssuesByElement(elementsWithIssues: Array<ElementWithIssues>) {
  const sortedElementsWithIssues = elementsWithIssues.toSorted((a, b) => {
    const impacts = orderedImpacts.toReversed();
    const impactWithDifferentIssueCount = impacts.find((impact) => {
      const aCount = a.issues.filter((issue) => issue.impact === impact).length;
      const bCount = b.issues.filter((issue) => issue.impact === impact).length;
      return aCount !== bCount;
    });
    if (impactWithDifferentIssueCount) {
      const aCount = a.issues.filter(
        (issue) => issue.impact === impactWithDifferentIssueCount,
      ).length;
      const bCount = b.issues.filter(
        (issue) => issue.impact === impactWithDifferentIssueCount,
      ).length;
      return bCount - aCount; // Sort by count of issues with the same impact
    }
    return sortByElementPositions(a.element, b.element);
  });

  for (const { element, issues } of sortedElementsWithIssues) {
    const sortedAndFilteredImpacts = orderedImpacts
      .toReversed()
      .filter((impact) => issues.some((issue) => issue.impact === impact));

    const issuesWithImpacts = sortedAndFilteredImpacts
      .map((impact) => `%c${issues.filter((issue) => issue.impact === impact).length} ${impact}`)
      .join(', ');

    const baseOutput = `${issuesWithImpacts}%c`;
    const output =
      issues.length === 1 && issues[0]
        ? `${baseOutput}\n${titleAndUrl(issues[0])}\n%o`
        : `${baseOutput}\n%o`;

    console.groupCollapsed(
      output,
      ...sortedAndFilteredImpacts.map((impact) => `color: ${colors[impact]};`),
      defaultStyle,
      element,
    );
    if (issues.length === 1) {
      console.log(issues[0]?.description);
    } else {
      for (const issue of issues) {
        console.groupCollapsed(
          `%c${impactText(issue.impact)}:%c\n${titleAndUrl(issue)}`,
          `color: ${colors[issue.impact]};`,
          defaultStyle,
        );
        console.log(issue.description);
        console.groupEnd();
      }
    }
    console.groupEnd();
  }
}

function logIssuesByType(issueTypeGroups: Array<IssueType>) {
  for (const { title, url, impact, elements } of issueTypeGroups) {
    const shouldOutputElementInline = elements.length === 1;
    const baseOutput = `%c${impactText(impact)} (${elements.length} element${elements.length === 1 ? '' : 's'}):%c\n${titleAndUrl({ title, url })}`;
    const output = shouldOutputElementInline ? `${baseOutput}\n%o` : baseOutput;
    console.groupCollapsed(
      output,
      `color: ${colors[impact]};`,
      defaultStyle,
      ...(shouldOutputElementInline ? [elements[0]?.element] : []),
    );
    if (shouldOutputElementInline) {
      console.log(elements[0]?.description);
    } else {
      for (const { element, description } of elements.sort((elementContainer1, elementContainer2) =>
        sortByElementPositions(elementContainer1.element, elementContainer2.element),
      )) {
        console.groupCollapsed('%o', element);
        console.log(description);
        console.groupEnd();
      }
    }
    console.groupEnd();
  }
}

// TODO: comment on this heavily
function logIssues(elementsWithIssues: Array<ElementWithIssues>) {
  const elementCount = elementsWithIssues.length;
  const issueCount = elementsWithIssues.reduce((acc, { issues }) => acc + issues.length, 0);
  console.group(
    `%c${issueCount} accessibility issue${issueCount === 1 ? '' : 's'} found in ${elementCount} element${issueCount === 1 ? '' : 's'} (Accented, ${accentedUrl}):\n`,
    defaultStyle,
  );

  if (issueCount <= MAX_ISSUES_BEFORE_OUTPUT_COLLAPSE) {
    logIssuesByElement(elementsWithIssues);
  } else {
    console.groupCollapsed(`%cBy element (${elementsWithIssues.length})`, defaultStyle);
    logIssuesByElement(elementsWithIssues);
    console.groupEnd();

    const issueTypeGroups = getIssueTypeGroups(elementsWithIssues);
    console.groupCollapsed(`%cBy issue type (${issueTypeGroups.length})`, defaultStyle);
    logIssuesByType(issueTypeGroups);
    console.groupEnd();
  }

  console.groupEnd();
}

export function createLogger() {
  let firstRun = true;

  return effect(() => {
    if (!enabled.value) {
      return;
    }

    const elementCount = elementsWithIssues.value.length;
    if (elementCount > 0) {
      logIssues(elementsWithIssues.value);
    } else {
      if (firstRun) {
        firstRun = false;
      } else {
        console.log(`No accessibility issues found (Accented, ${accentedUrl}).`);
      }
    }
  });
}
