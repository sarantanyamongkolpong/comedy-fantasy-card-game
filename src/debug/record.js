import { dataClone } from './canonical.js';
import { LOG_FORMAT, LOG_VERSION } from './constants.js';
import { runSequence } from './execute.js';
import { sealLog } from './integrity.js';
import { describeRuleset } from './ruleset.js';
import { assertScenario } from './scenario.js';

export { stringifyLog, sealLog, checkIntegrity } from './integrity.js';

/**
 * Record a scenario by calling the public battle API.
 * The returned log is sealed and key-sorted.
 * @param {object} scenario
 * @param {{ id: string, label?: string | null, parameters?: object, rules?: Record<string, Function> }} ruleset
 */
export function recordScenario(scenario, ruleset) {
  assertScenario(scenario);
  if (!ruleset || typeof ruleset !== 'object' || Array.isArray(ruleset)) {
    throw new TypeError('ruleset is required');
  }
  if (scenario.rulesetId !== undefined && scenario.rulesetId !== ruleset.id) {
    throw new TypeError(`scenario rulesetId ${scenario.rulesetId} does not match ruleset ${ruleset.id}`);
  }
  const executed = runSequence(scenario, ruleset.rules ?? {});
  return sealLog({
    format: LOG_FORMAT,
    version: LOG_VERSION,
    label: scenario.label ?? ruleset.label ?? null,
    note: scenario.note ?? null,
    battleId: scenario.battleId,
    ruleset: describeRuleset(ruleset),
    setup: dataClone({
      sideA: scenario.sideA,
      sideB: scenario.sideB,
      hands: scenario.hands ?? {},
    }),
    setupResult: executed.setupResult,
    initialState: executed.initialState,
    events: executed.events,
    finalState: executed.finalState,
  });
}
