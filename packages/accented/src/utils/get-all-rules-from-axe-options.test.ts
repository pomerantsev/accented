/**
 * The tests in this test suite have e2e counterparts in axe-options.spec.ts.
 * If we ever change this file, we should make sure axe-options.spec.ts
 * doesn't diverge.
 * That way, we can be sure that our reimplementation of runOnly / rules
 * is in sync with that in axe-core.
 */

import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import { getAllRulesFromAxeOptions } from './get-all-rules-from-axe-options';

suite('getAllRulesFromAxeOptions', () => {
  test('with no options, returns all rules', () => {
    const rules = getAllRulesFromAxeOptions({});
    assert.ok(rules.size > 90);
    assert.ok(rules.has('page-has-heading-one'));
    assert.ok(rules.has('color-contrast'));
  });

  test('with no options, excludes disabled-by-default rules', () => {
    const rules = getAllRulesFromAxeOptions({});
    // axe-core disables some rules by default
    assert.equal(rules.has('color-contrast-enhanced'), false);
    assert.equal(rules.has('target-size'), false);
    assert.equal(rules.has('audio-caption'), false);
  });

  test('with runOnly type rule, returns exactly the specified rules', () => {
    const rules = getAllRulesFromAxeOptions({
      runOnly: { type: 'rule', values: ['color-contrast', 'button-name'] },
    });
    assert.equal(rules.size, 2);
    assert.ok(rules.has('color-contrast'));
    assert.ok(rules.has('button-name'));
  });

  test('with runOnly type rule, ignores rules.enabled: true for a rule not in runOnly', () => {
    const rules = getAllRulesFromAxeOptions({
      runOnly: { type: 'rule', values: ['button-name'] },
      rules: { 'color-contrast': { enabled: true } },
    });
    assert.equal(rules.size, 1);
    assert.equal(rules.has('color-contrast'), false);
  });

  test('with runOnly type rule, ignores rules.enabled: false', () => {
    const rules = getAllRulesFromAxeOptions({
      runOnly: { type: 'rule', values: ['color-contrast'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    assert.equal(rules.size, 1);
    assert.ok(rules.has('color-contrast'));
  });

  test('with runOnly type tag, returns rules matching those tags', () => {
    const rules = getAllRulesFromAxeOptions({
      runOnly: { type: 'tag', values: ['best-practice'] },
    });
    assert.ok(rules.has('page-has-heading-one'));
    assert.equal(rules.has('color-contrast'), false);
  });

  test('with runOnly type tag and multiple tags, returns rules from all specified tags', () => {
    const rules = getAllRulesFromAxeOptions({
      runOnly: { type: 'tag', values: ['best-practice', 'wcag2aa'] },
    });
    assert.ok(rules.has('page-has-heading-one'));
    assert.ok(rules.has('color-contrast'));
    assert.equal(rules.has('button-name'), false); // wcag2a only, not in either tag
  });

  test('with runOnly type tag, rules.enabled: false removes a matching rule', () => {
    const rules = getAllRulesFromAxeOptions({
      runOnly: { type: 'tag', values: ['wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    assert.ok(rules.has('meta-viewport')); // another wcag2aa rule, still included
    assert.equal(rules.has('color-contrast'), false);
  });

  test('with runOnly type tag, rules.enabled: true adds a non-matching rule', () => {
    const rules = getAllRulesFromAxeOptions({
      runOnly: { type: 'tag', values: ['best-practice'] },
      rules: { 'color-contrast': { enabled: true } },
    });
    assert.ok(rules.has('page-has-heading-one'));
    assert.ok(rules.has('color-contrast'));
    assert.equal(rules.has('button-name'), false); // not in best-practice and not explicitly enabled
  });

  test('with no runOnly and rules overrides, still excludes disabled-by-default rules', () => {
    const rules = getAllRulesFromAxeOptions({
      rules: { 'color-contrast': { enabled: false }, 'button-name': { enabled: true } },
    });
    assert.equal(rules.has('color-contrast'), false); // explicitly disabled
    assert.ok(rules.has('button-name')); // explicitly enabled
    assert.equal(rules.has('color-contrast-enhanced'), false); // disabled by default, no override
  });

  test('with no runOnly, rules.enabled: false removes a rule', () => {
    const rules = getAllRulesFromAxeOptions({
      rules: { 'color-contrast': { enabled: false } },
    });
    assert.ok(rules.size > 90);
    assert.equal(rules.has('color-contrast'), false);
  });

  test('with runOnly as a tag array shorthand, treats it as tag values', () => {
    const rules = getAllRulesFromAxeOptions({ runOnly: ['best-practice'] });
    assert.ok(rules.has('page-has-heading-one'));
    assert.equal(rules.has('color-contrast'), false);
  });

  test('with runOnly as a single tag string, treats it as a tag value', () => {
    const rules = getAllRulesFromAxeOptions({ runOnly: 'best-practice' });
    assert.ok(rules.has('page-has-heading-one'));
    assert.equal(rules.has('color-contrast'), false);
  });

  test('with runOnly as a rule ID string shorthand, returns that rule', () => {
    const rules = getAllRulesFromAxeOptions({ runOnly: 'color-contrast' });
    assert.equal(rules.size, 1);
    assert.ok(rules.has('color-contrast'));
  });

  test('with runOnly as a rule ID array shorthand, returns exactly those rules', () => {
    const rules = getAllRulesFromAxeOptions({ runOnly: ['color-contrast', 'button-name'] });
    assert.equal(rules.size, 2);
    assert.ok(rules.has('color-contrast'));
    assert.ok(rules.has('button-name'));
  });

  test('with runOnly as a rule ID array shorthand, ignores rules overrides', () => {
    const rules = getAllRulesFromAxeOptions({
      runOnly: ['color-contrast', 'button-name'],
      rules: { 'color-contrast': { enabled: false }, 'aria-label': { enabled: true } },
    });
    assert.equal(rules.size, 2);
    assert.ok(rules.has('color-contrast'));
    assert.ok(rules.has('button-name'));
  });

  test('with runOnly as a mixed shorthand array (tag + rule ID), throws', () => {
    assert.throws(() =>
      getAllRulesFromAxeOptions({ runOnly: ['best-practice', 'color-contrast'] }),
    );
  });
});
