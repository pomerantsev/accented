/* Adapts two axe-core behaviors:
   - shorthand string/array runOnly normalization from normalizeOptions:
     https://github.com/dequelabs/axe-core/blob/9261d074b60527a84f4dce5a64a6d5a5843a0772/lib/core/base/audit.js#L408-L428
   - which rules to include for a given runOnly/rules combination, from ruleShouldRun (lines 65–80,
     omitting the rule.pageLevel check — axe applies that itself when we call axe.run):
     https://github.com/dequelabs/axe-core/blob/9261d074b60527a84f4dce5a64a6d5a5843a0772/lib/core/utils/rule-should-run.js */
import axe from 'axe-core';
import type { AxeOptions } from '../types.ts';

function getRuleIds(tags?: Array<string>): Set<string> {
  return new Set(axe.getRules(tags).map((r) => r.ruleId));
}

function applyOverrides(ruleSet: Set<string>, rules: AxeOptions['rules']): Set<string> {
  if (!rules) return ruleSet;
  for (const [ruleId, ruleConfig] of Object.entries(rules)) {
    if (ruleConfig.enabled === false) ruleSet.delete(ruleId);
    else if (ruleConfig.enabled === true) ruleSet.add(ruleId);
  }
  return ruleSet;
}

// Normalizes the string/array shorthands of runOnly into the { type, values } object form.
function normalizeRunOnly(
  runOnly: Exclude<AxeOptions['runOnly'], undefined>,
  allRuleIds: Set<string>,
): { type: string; values: string[] } {
  if (typeof runOnly !== 'string' && !Array.isArray(runOnly)) return runOnly;
  const values = typeof runOnly === 'string' ? [runOnly] : runOnly;
  const isRulePath = values.every((v) => allRuleIds.has(v));
  const isTagPath = values.every((v) => !allRuleIds.has(v));
  if (!isRulePath && !isTagPath)
    throw new Error(`runOnly mixes rule IDs and tag values: ${values.join(', ')}`);
  return { type: isRulePath ? 'rule' : 'tag', values };
}

export function getAllRulesFromAxeOptions(axeOptions: AxeOptions): Set<string> {
  const allRuleIds = getRuleIds();
  const { rules, runOnly } = axeOptions;

  if (runOnly === undefined) {
    // axe.getRules() includes rules disabled by default; axe skips them via rule.enabled !== false.
    // Replicate that here using the internal _audit.rules, which exposes the enabled flag.
    // @ts-expect-error: _audit is an undocumented internal axe-core API not present in its type definitions
    for (const rule of axe._audit.rules) {
      if (rule.enabled === false) allRuleIds.delete(rule.id);
    }
    return applyOverrides(allRuleIds, rules);
  }

  const { type, values } = normalizeRunOnly(runOnly, allRuleIds);
  if (type === 'rule' || type === 'rules') return new Set(values);
  return applyOverrides(getRuleIds(values), rules);
}
