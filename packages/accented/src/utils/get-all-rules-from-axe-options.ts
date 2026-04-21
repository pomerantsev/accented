import axe from 'axe-core';
import type { AxeOptions } from '../types.ts';

function fromTagsAndRules(tags: string[] | undefined, rules: AxeOptions['rules']): Set<string> {
  const ruleSet = new Set(axe.getRules(tags).map((r) => r.ruleId));
  if (tags === undefined) {
    // axe.getRules() includes rules disabled by default; axe skips them via rule.enabled !== false.
    // Replicate that here using the internal _audit.rules, which exposes the enabled flag.
    // @ts-expect-error: _audit is an undocumented internal axe-core API not present in its type definitions
    for (const rule of axe._audit.rules) {
      if (rule.enabled === false) ruleSet.delete(rule.id);
    }
  }
  if (!rules) return ruleSet;
  for (const [ruleId, ruleConfig] of Object.entries(rules)) {
    if (ruleConfig.enabled === false) {
      ruleSet.delete(ruleId);
    } else if (ruleConfig.enabled === true) {
      ruleSet.add(ruleId);
    }
  }
  return ruleSet;
}

export function getAllRulesFromAxeOptions(axeOptions: AxeOptions): Set<string> {
  const { runOnly, rules } = axeOptions;

  if (runOnly === undefined) return fromTagsAndRules(undefined, rules);
  if (typeof runOnly === 'string') return fromTagsAndRules([runOnly], rules);
  if (Array.isArray(runOnly)) return fromTagsAndRules(runOnly, rules);

  const { type, values } = runOnly;
  if (type === 'rule' || type === 'rules') return new Set(values);
  return fromTagsAndRules(values, rules);
}
