import { expect, test } from '@playwright/test';

/**
 * These tests verify our understanding of axe-core's rule configuration API
 * (runOnly, rules) by calling axe.run() directly in the browser. If they ever
 * fail, it means axe-core changed how it applies these options, and our internal
 * rule-handling logic needs to be revisited
 * (see get-all-rules-from-axe-options.ts and its tests).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/axe-direct.html');
});

test('with no options, reports more than one violation', async ({ page }) => {
  const result = await page.evaluate(() => window.axe.run({ resultTypes: ['violations'] }));
  expect(result.violations.length).toBeGreaterThan(1);
});

test('with no options, excludes disabled-by-default rules', async ({ page }) => {
  const result = await page.evaluate(() => window.axe.run({ resultTypes: ['violations'] }));
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).not.toContain('color-contrast-enhanced');
  expect(ruleIds).not.toContain('target-size');
});

test('with runOnly type rule, runs exactly the specified rules', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      runOnly: { type: 'rule', values: ['color-contrast', 'button-name'] },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('color-contrast');
  expect(ruleIds).toContain('button-name');
  expect(ruleIds).toHaveLength(2);
});

test('with runOnly type rule, ignores rules.enabled: true for a rule not in runOnly', async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      runOnly: { type: 'rule', values: ['button-name'] },
      rules: { 'color-contrast': { enabled: true } },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('button-name');
  expect(ruleIds).not.toContain('color-contrast');
});

test('with runOnly type rule, ignores rules.enabled: false', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      runOnly: { type: 'rule', values: ['color-contrast'] },
      rules: { 'color-contrast': { enabled: false } },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('color-contrast');
  expect(ruleIds).toHaveLength(1);
});

test('with runOnly type tag, runs rules matching those tags', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      runOnly: { type: 'tag', values: ['best-practice'] },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('page-has-heading-one');
  expect(ruleIds).not.toContain('color-contrast');
});

test('with runOnly type tag and multiple tags, runs rules from all specified tags', async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      runOnly: { type: 'tag', values: ['best-practice', 'wcag2aa'] },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('page-has-heading-one');
  expect(ruleIds).toContain('color-contrast');
  expect(ruleIds).not.toContain('button-name'); // wcag2a only, not in either tag
});

test('with runOnly type tag, rules.enabled: false removes a matching rule', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      runOnly: { type: 'tag', values: ['wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('meta-viewport'); // another wcag2aa rule, still runs
  expect(ruleIds).not.toContain('color-contrast');
});

test('with runOnly type tag, rules.enabled: true adds a non-matching rule', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      runOnly: { type: 'tag', values: ['best-practice'] },
      rules: { 'color-contrast': { enabled: true } },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('page-has-heading-one');
  expect(ruleIds).toContain('color-contrast');
  expect(ruleIds).not.toContain('button-name'); // not in best-practice and not explicitly enabled
});

test('with no runOnly and rules overrides, still excludes disabled-by-default rules', async ({
  page,
}) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      rules: { 'color-contrast': { enabled: false }, 'button-name': { enabled: true } },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).not.toContain('color-contrast'); // explicitly disabled
  expect(ruleIds).toContain('button-name'); // explicitly enabled
  expect(ruleIds).not.toContain('color-contrast-enhanced'); // disabled by default, no override
});

test('with no runOnly, rules.enabled: false removes a rule', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      rules: { 'color-contrast': { enabled: false } },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds.length).toBeGreaterThan(5);
  expect(ruleIds).not.toContain('color-contrast');
});

test('with runOnly as a tag array shorthand, treats it as tag values', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({ runOnly: ['best-practice'], resultTypes: ['violations'] }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('page-has-heading-one');
  expect(ruleIds).not.toContain('color-contrast');
});

test('with runOnly as a single tag string, treats it as a tag value', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({ runOnly: 'best-practice', resultTypes: ['violations'] }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('page-has-heading-one');
  expect(ruleIds).not.toContain('color-contrast');
});

test('with runOnly as a rule ID string shorthand, runs that rule', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({ runOnly: 'color-contrast', resultTypes: ['violations'] }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('color-contrast');
  expect(ruleIds).toHaveLength(1);
});

test('with runOnly as a rule ID array shorthand, runs exactly those rules', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({ runOnly: ['color-contrast', 'button-name'], resultTypes: ['violations'] }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('color-contrast');
  expect(ruleIds).toContain('button-name');
  expect(ruleIds).toHaveLength(2);
});

test('with runOnly as a rule ID array shorthand, ignores rules overrides', async ({ page }) => {
  const result = await page.evaluate(() =>
    window.axe.run({
      runOnly: ['color-contrast', 'button-name'],
      rules: { 'color-contrast': { enabled: false }, 'html-has-lang': { enabled: true } },
      resultTypes: ['violations'],
    }),
  );
  const ruleIds = result.violations.map((v) => v.id);
  expect(ruleIds).toContain('color-contrast');
  expect(ruleIds).toContain('button-name');
  expect(ruleIds).not.toContain('html-has-lang');
  expect(ruleIds).toHaveLength(2);
});

test('with runOnly as a mixed shorthand array (tag + rule ID), throws', async ({ page }) => {
  await expect(
    page.evaluate(() =>
      window.axe.run({ runOnly: ['best-practice', 'color-contrast'], resultTypes: ['violations'] }),
    ),
  ).rejects.toThrow();
});
