import { getOutcome, endTurn, playAction, previewAction, resolveEndOfRoundDiscard } from './match.js';
import { living, opponentId, permitMatches } from './model.js';

function byId(left, right, key) {
  if (left[key] < right[key]) return -1;
  if (left[key] > right[key]) return 1;
  return 0;
}

function candidateTargets(state, side, card) {
  const pureTrigger = card.type === 'Skill'
    && card.effects.length > 0
    && card.effects.every((effect) => effect.op === 'trigger_active');
  if (pureTrigger) return [[]];
  const enemy = state.sides[opponentId(state, side.sideId)];
  if (card.targetRule === 'Enemy') {
    return living(enemy.avatars)
      .sort((left, right) => byId(left, right, 'avatarId'))
      .map((unit) => [unit.avatarId]);
  }
  if (card.targetRule === 'Ally') {
    return living(side.avatars)
      .sort((left, right) => byId(left, right, 'avatarId'))
      .map((unit) => [unit.avatarId]);
  }
  if (card.targetRule === 'Self' || card.targetRule === 'All_Allies' || card.targetRule === 'All_Enemies') return [[]];
  const effect = card.effects.find((item) => item.op === 'retrieve');
  if (!effect) return [];
  const pile = side.zones[effect.pile] ?? [];
  const permitted = pile.filter((item) => permitMatches(item, effect.permit))
    .sort((left, right) => byId(left, right, 'instanceId'));
  const count = effect.count ?? 1;
  if (permitted.length < count) return [];
  return [{ retrieveInstanceIds: permitted.slice(0, count).map((item) => item.instanceId) }];
}

function chooseAction(state) {
  const side = state.sides[state.activeSideId];
  const cards = [...side.zones.hand].sort((left, right) => byId(left, right, 'instanceId'));
  const actors = living(side.avatars).sort((left, right) => byId(left, right, 'avatarId'));
  for (const card of cards) {
    for (const actor of actors) {
      for (const targets of candidateTargets(state, side, card)) {
        const action = { cardInstanceId: card.instanceId, actorAvatarId: actor.avatarId, targets };
        if (previewAction(state, action).ok) return action;
      }
    }
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
      const sorted = [...current.zones.hand].sort((left, right) => byId(left, right, 'instanceId'));
      for (let index = 0; index < excess; index += 1) ids.push(sorted[index].instanceId);
    }
    if (ids.length > 0) discarded = resolveEndOfRoundDiscard(state, ids);
  }
  return { ok: true, played, ended, discarded, outcome: getOutcome(state) };
}
