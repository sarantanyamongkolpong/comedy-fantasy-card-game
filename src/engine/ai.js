import { orderedCandidates } from './candidates.js';
import { getOutcome, endTurn, playAction, previewAction, resolveEndOfRoundDiscard } from './match.js';

function byInstance(left, right) {
  if (left.instanceId < right.instanceId) return -1;
  if (left.instanceId > right.instanceId) return 1;
  return 0;
}

function chooseAction(state) {
  const side = state.sides[state.activeSideId];
  for (const pair of orderedCandidates(state, side)) {
    const action = {
      cardInstanceId: pair.card.instanceId,
      actorAvatarId: pair.actor.avatarId,
      targets: pair.targets,
    };
    if (previewAction(state, action).ok) return action;
  }
  return null;
}

/**
 * Deterministic demo AI. Plays the lowest instance id that is legal with the
 * lowest avatar id, then ends the turn. Mandatory discards from AI hands use
 * the lowest instance ids. Human hands are left for the caller.
 * @param {object} state
 */
export function runEnemyTurn(state) {
  if (state.outcome.status === 'decided') return { ok: false, reason: 'BATTLE_DECIDED', outcome: getOutcome(state) };
  const side = state.sides[state.activeSideId];
  if (!side || side.control !== 'ai') return { ok: false, reason: 'NOT_AI_SIDE', outcome: getOutcome(state) };
  if (state.phase !== 'action') return { ok: false, reason: 'WRONG_PHASE', outcome: getOutcome(state) };
  const played = [];
  for (let guard = 0; guard < 40; guard += 1) {
    const choice = chooseAction(state);
    if (!choice) break;
    const result = playAction(state, choice);
    if (!result.ok) break;
    played.push(result.cardInstanceId);
    if (state.outcome.status === 'decided') return { ok: true, played, ended: false, outcome: getOutcome(state) };
  }
  const ended = endTurn(state);
  let discarded = null;
  if (state.phase === 'end_of_round_discard') {
    const ids = [];
    for (const sideId of state.sideOrder) {
      const current = state.sides[sideId];
      const excess = current.zones.hand.length - state.config.handSize.value;
      if (excess <= 0 || current.control !== 'ai') continue;
      const sorted = [...current.zones.hand].sort(byInstance);
      for (let index = 0; index < excess; index += 1) ids.push(sorted[index].instanceId);
    }
    if (ids.length > 0) discarded = resolveEndOfRoundDiscard(state, ids);
  }
  return { ok: true, played, ended, discarded, outcome: getOutcome(state) };
}
