import { resolveRules } from '../index.js';
import { assertJsonData, canonicalString, sha256 } from './canonical.js';

/**
 * Identify the rule functions createBattle will actually call.
 * Engine defaults are recognized by source text, not by invoking them.
 * Injected functions keep whatever label the caller attached.
 * @param {{ id: string, label?: string | null, parameters?: object, rules?: Record<string, Function> }} ruleset
 */
export function describeRuleset(ruleset) {
  if (!ruleset || typeof ruleset.id !== 'string' || ruleset.id.length === 0) {
    throw new TypeError('ruleset.id is required');
  }
  if (ruleset.parameters !== undefined) assertJsonData(ruleset.parameters, 'ruleset.parameters');
  const resolved = resolveRules(ruleset.rules ?? {});
  const defaults = defaultSources();
  const entries = Object.keys(resolved).map((key) => {
    const fn = resolved[key];
    if (typeof fn !== 'function') throw new TypeError(`Rule "${key}" must be a function`);
    const source = normalizeSource(fn);
    const label = typeof fn.label === 'string' && fn.label.length > 0 ? fn.label : null;
    let kind = 'UNLABELLED';
    if (source === defaults[key]) kind = 'ENGINE_DEFAULT';
    else if (label) kind = 'LABELLED';
    return {
      key,
      name: fn.name || '',
      kind,
      label,
      sourceHash: sha256(source),
    };
  });
  const identity = {
    id: ruleset.id,
    label: ruleset.label ?? null,
    parameters: ruleset.parameters ?? {},
    entries,
  };
  return {
    ...identity,
    hash: sha256(canonicalString(identity)),
  };
}

/**
 * @param {Function} fn
 */
export function normalizeSource(fn) {
  return Function.prototype.toString.call(fn).replace(/\r\n/g, '\n');
}

function defaultSources() {
  const resolved = resolveRules({});
  return Object.fromEntries(Object.keys(resolved).map((key) => [key, normalizeSource(resolved[key])]));
}
