/**
 * v0.5 battle engine. Public contract (names are stable):
 * createMatch, startTurn, playAction, discardVoluntary, endTurn,
 * resolveEndOfRoundDiscard, getZones, getOutcome, getState, defaultRuleConfig.
 * Extensions: previewAction, armAction, cancelAction, runEnemyTurn,
 * proposedSampleRoster, buildSampleDeck, proposedSampleMatchInput.
 * The build is incomplete and must not be treated as a finished ruleset.
 */

export { gameError } from './errors.js';
export { defaultRuleConfig, pendingDecisionIds, resolveRuleConfig } from './rule-config.js';
export { proposedSampleMatchInput, proposedSampleRoster, buildSampleDeck, sampleCard } from './samples.js';
export { runEnemyTurn } from './ai.js';
export {
  cancelAction,
  armAction,
  createMatch,
  discardVoluntary,
  endTurn,
  getOutcome,
  getState,
  getZones,
  playAction,
  previewAction,
  resolveEndOfRoundDiscard,
  startTurn,
} from './match.js';
