import axe from 'axe-core';
import type { AxeOptions } from '../types.ts';

function fromTagsAndRules(tags: string[] | undefined, rules: AxeOptions['rules']): Set<string> {
  const ruleSet = new Set(axe.getRules(tags).map((r) => r.ruleId));
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
