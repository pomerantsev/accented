import { effect } from '@preact/signals-core';
import {
  consoleColorImpactCritical,
  consoleColorImpactMinor,
  consoleColorImpactModerate,
  consoleColorImpactSerious,
} from './common/tokens.js';
import { accentedUrl, orderedImpacts } from './constants.js';
import { elementsWithIssues, enabled } from './state.js';
import type { ElementWithIssues, Issue } from './types.ts';
import { areElementsWithIssuesEqual } from './utils/are-elements-with-issues-equal.js';
import { areIssueSetsEqual } from './utils/are-issue-sets-equal.js';
import { areIssuesEqual } from './utils/are-issues-equal.js';

// For user friendliness, we want to balance two things:
// * the user shouldn't have to click in the console too many times to get to the info they need;
// * the output should be concise and not overwhelm the user with too much information at once.
// This number is chosen as a compromise between these two factors.
const MAX_ISSUES_BEFORE_OUTPUT_COLLAPSE = 5;

// Groups have bold color by default in the console.
// This doesn't seem appropriate for our purposes, so we have to explicitly set the normal font weight.
const defaultStyle = 'font-weight: normal;';

// We'll use the same colors in the console as in the dialog UI
// (except the theme will be reversed since in the dialog, the color needs to have enough contrast against text color,
// and in the console, the color needs to have enough contrast against the background color).
const colors = {
  minor: consoleColorImpactMinor,
  moderate: consoleColorImpactModerate,
  serious: consoleColorImpactSerious,
  critical: consoleColorImpactCritical,
};

const uppercasedImpactText = (impact: Issue['impact']) =>
  impact.charAt(0).toUpperCase() + impact.slice(1);

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

const getIssueTypeGroups = (elsWithIssues: Array<ElementWithIssues>) => {
  const groupedByIssueType = elsWithIssues.reduce((acc, { element, issues }) => {
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

function logIssuesByElement(elsWithIssues: Array<ElementWithIssues>) {
  // Elements with more severe issues (or with a higher number of issues of the same severity)
  // will appear higher in the output.
  // This way, issues with a higher severity will be prioritized.
  const sortedElementsWithIssues = elsWithIssues.toSorted((a, b) => {
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
      // If an element has just one issue, output that issue inline, to reduce the number of clicks in the console for the user.
      console.log(issues[0]?.description);
    } else {
      for (const issue of issues) {
        console.groupCollapsed(
          `%c${uppercasedImpactText(issue.impact)}:%c\n${titleAndUrl(issue)}`,
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
    // We'll output the element itself next to the issue description if there's just one associated element,
    // to reduce the number of clicks in the console for the user.
    const shouldOutputElementInline = elements.length === 1;
    const baseOutput = `%c${uppercasedImpactText(impact)} (${elements.length} element${elements.length === 1 ? '' : 's'}):%c\n${titleAndUrl({ title, url })}`;
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

function logNewIssues(
  elsWithIssues: Array<ElementWithIssues>,
  previousElementsWithIssues: Array<ElementWithIssues>,
) {
  // The elements with accessibility issues that didn't have any associated issues
  // or that weren't in the DOM at the time of last scan.
  const addedElements = elsWithIssues.filter((elementWithIssues) => {
    return !previousElementsWithIssues.some((previousElementWithIssues) =>
      areElementsWithIssuesEqual(previousElementWithIssues, elementWithIssues),
    );
  });

  // The elements that now have more issues than at the time of last scan,
  // with just the new issues (previously existing issues are filtered out).
  const existingElementsWithNewIssues = elsWithIssues.reduce<Array<ElementWithIssues>>(
    (acc, elementWithIssues) => {
      let foundElementWithIssues: ElementWithIssues | null = null;
      for (const previousElementWithIssues of previousElementsWithIssues) {
        if (
          areElementsWithIssuesEqual(previousElementWithIssues, elementWithIssues) &&
          !areIssueSetsEqual(previousElementWithIssues.issues, elementWithIssues.issues)
        ) {
          const newIssues = elementWithIssues.issues.filter((issue) => {
            return !previousElementWithIssues.issues.some((prevIssue) =>
              areIssuesEqual(prevIssue, issue),
            );
          });
          if (newIssues.length > 0) {
            foundElementWithIssues = {
              ...elementWithIssues,
              issues: newIssues,
            };
            acc.push(foundElementWithIssues);
          }
          break;
        }
      }
      return acc;
    },
    [],
  );

  const elementsWithNewIssues = [...addedElements, ...existingElementsWithNewIssues];
  const newIssueCount = elementsWithNewIssues.reduce((acc, { issues }) => acc + issues.length, 0);
  if (newIssueCount === 0) {
    console.log('No new issues');
  } else {
    const newIssuesMessage = `%cNew issues (${newIssueCount} in ${elementsWithNewIssues.length} element${elementsWithNewIssues.length === 1 ? '' : 's'})`;
    if (newIssueCount <= MAX_ISSUES_BEFORE_OUTPUT_COLLAPSE) {
      // Don't collapse the new issues if there are not too many (this hopefully helps user avoid unnecessary clicks in the console).
      console.group(newIssuesMessage, defaultStyle);
    } else {
      console.groupCollapsed(newIssuesMessage, defaultStyle);
    }
    // Output by element (no specific reason for this choice, just a preference).
    logIssuesByElement(elementsWithNewIssues);
    console.groupEnd();
  }
}

function logIssues(
  elsWithIssues: Array<ElementWithIssues>,
  previousElementsWithIssues: Array<ElementWithIssues>,
) {
  const elementCount = elsWithIssues.length;

  if (elementCount === 0) {
    console.log(`No accessibility issues (Accented, ${accentedUrl}).`);
    return;
  }

  const issueCount = elsWithIssues.reduce((acc, { issues }) => acc + issues.length, 0);
  console.group(
    `%c${issueCount} accessibility issue${issueCount === 1 ? '' : 's'} in ${elementCount} element${elementCount === 1 ? '' : 's'} (Accented, ${accentedUrl}):\n`,
    defaultStyle,
  );

  if (issueCount <= MAX_ISSUES_BEFORE_OUTPUT_COLLAPSE) {
    // Don't collapse issues if there are not too many (this hopefully helps user avoid unnecessary clicks in the console).
    // Output by element (no specific reason for this choice, just a preference).
    logIssuesByElement(elsWithIssues);
  } else {
    // When there are many issues, outputting them all would probably make the console too noisy,
    // so we collapse them.
    // Moreover, we output all issues twice, by element and by issue type, to give users more choice.
    console.groupCollapsed(`%cAll by element (${elsWithIssues.length})`, defaultStyle);
    logIssuesByElement(elsWithIssues);
    console.groupEnd();

    const issueTypeGroups = getIssueTypeGroups(elsWithIssues);
    console.groupCollapsed(`%cAll by issue type (${issueTypeGroups.length})`, defaultStyle);
    logIssuesByType(issueTypeGroups);
    console.groupEnd();
  }

  if (previousElementsWithIssues.length > 0) {
    // Log new issues separately, to make it easier for the user to know what issues
    // were introduced recently.
    logNewIssues(elsWithIssues, previousElementsWithIssues);
  }

  console.groupEnd();
}

export function createLogger() {
  let previousElementsWithIssues: Array<ElementWithIssues> = [];

  return effect(() => {
    if (!enabled.value) {
      return;
    }

    logIssues(elementsWithIssues.value, previousElementsWithIssues);

    previousElementsWithIssues = elementsWithIssues.value;
  });
}
