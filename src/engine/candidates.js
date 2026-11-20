import { living, opponentId, permitMatches } from './model.js';

function byId(left, right, key) {
  if (left[key] < right[key]) return -1;
  if (left[key] > right[key]) return 1;
  return 0;
}

/**
 * Target sets in a stable order. Taunt, faction, cost, and retrieve permission
 * are not decided here; callers keep only the sets that preview as legal.
 * @param {object} state
 * @param {object} side
 * @param {object} card
 */
export function candidateTargets(state, side, card) {
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

/**
 * Every actor/target pair for this hand, lowest card instance then lowest avatar id.
 * @param {object} state
 * @param {object} side
 */
export function orderedCandidates(state, side) {
  const cards = [...side.zones.hand].sort((left, right) => byId(left, right, 'instanceId'));
  const actors = living(side.avatars).sort((left, right) => byId(left, right, 'avatarId'));
  const pairs = [];
  for (const card of cards) {
    for (const actor of actors) {
      for (const targets of candidateTargets(state, side, card)) {
        pairs.push({ card, actor, targets });
      }
    }
  }
  return pairs;
}

export function compareIds(left, right) {
  return byId(left, right, 'instanceId') || byId(left, right, 'avatarId') || byId(left, right, 'cardId');
}
