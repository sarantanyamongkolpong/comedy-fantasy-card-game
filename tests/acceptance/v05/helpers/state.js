import assert from 'node:assert/strict';

const ZONE_KEYS = ['draw', 'hand', 'discard', 'void'];
const RESULTS = new Set(['ongoing', 'win', 'lose', 'simultaneous']);

/**
 * @param {unknown} result
 * @param {object} [previous]
 */
export function asState(result, previous) {
  if (result && typeof result === 'object') {
    if (result.state && typeof result.state === 'object' && result.state.sides) return result.state;
    if (result.sides && typeof result.sides === 'object') return result;
    if (result.ok === true && previous && previous.sides) return previous;
    if (result.counters && typeof result.counters === 'object') return result;
  }
  if (previous && result === previous) return previous;
  throw new Error('Call must return the next state or { state }. See docs/qa/v05/API_CONTRACT.md.');
}

/**
 * @param {object} state
 * @param {string} sideId
 */
export function side(state, sideId) {
  const found = state?.sides?.[sideId];
  if (!found || typeof found !== 'object') {
    throw new Error(`state.sides.${sideId} is missing. Acceptance state keeps each side under state.sides.`);
  }
  return found;
}

/**
 * @param {object} state
 * @param {string} sideId
 */
export function apOf(state, sideId) {
  const value = side(state, sideId).ap;
  if (!Number.isInteger(value)) throw new Error(`state.sides.${sideId}.ap must be an integer`);
  return value;
}

/**
 * @param {{ getZones: Function }} engine
 * @param {object} state
 * @param {string} sideId
 */
export function zonesOf(engine, state, sideId) {
  const zones = engine.getZones(state, sideId);
  if (!zones || typeof zones !== 'object') throw new Error('getZones must return an object');
  for (const key of ZONE_KEYS) {
    if (!Array.isArray(zones[key])) throw new Error(`getZones().${key} must be an array`);
  }
  return zones;
}

/**
 * @param {{ getOutcome: Function }} engine
 * @param {object} state
 */
export function readOutcome(engine, state) {
  const outcome = engine.getOutcome(state);
  if (!outcome || typeof outcome !== 'object') throw new Error('getOutcome must return an object');
  const winningSideId = outcome.winningSideId ?? outcome.winnerSideId ?? null;
  const losingSideId = outcome.losingSideId ?? outcome.loserSideId ?? null;
  let result = outcome.result;
  if (!RESULTS.has(result)) {
    if (outcome.status === 'ongoing') result = 'ongoing';
    else if (outcome.reason === 'simultaneous_death') result = 'simultaneous';
    else if (winningSideId === 'player') result = 'win';
    else if (winningSideId && winningSideId !== 'player') result = 'lose';
  }
  if (!RESULTS.has(result)) {
    throw new Error(`getOutcome must say ongoing, win, lose, or simultaneous, got ${JSON.stringify(outcome)}`);
  }
  const rewards = Array.isArray(outcome.rewards)
    ? outcome.rewards
    : outcome.rewards && typeof outcome.rewards === 'object'
      ? [{ id: outcome.rewards.emissionId ?? outcome.rewards.id, ...outcome.rewards }]
      : [];
  if (!Array.isArray(rewards)) throw new Error('getOutcome.rewards must be an array or one rewards object');
  return { ...outcome, result, winningSideId, losingSideId, rewards };
}

/**
 * @param {{ id?: string }[]} rewards
 */
export function duplicateRewardIds(rewards) {
  const seen = new Set();
  const duplicates = [];
  for (const reward of rewards) {
    const id = reward && reward.id;
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error('each reward needs a non-empty string id');
    }
    if (seen.has(id)) duplicates.push(id);
    seen.add(id);
  }
  return duplicates;
}

/**
 * @param {object[]} pile
 */
export function instanceIds(pile) {
  return pile.map((card) => {
    if (!card || typeof card.instanceId !== 'string') throw new Error('zone card is missing instanceId');
    return card.instanceId;
  });
}

/**
 * @param {object} card
 * @param {string} cardId
 */
export function isCard(card, cardId) {
  return card?.cardId === cardId || card?.defId === cardId;
}

/**
 * @param {object[]} hand
 * @param {string} cardId
 */
export function findCard(hand, cardId) {
  const card = hand.find((entry) => isCard(entry, cardId));
  if (!card) throw new Error(`Hand is missing ${cardId}. deal:"preserve" must keep deck order.`);
  return card;
}

/**
 * @param {{ playAction: Function, getZones: Function }} engine
 * @param {object} state
 * @param {string} sideId
 * @param {string} cardId
 * @param {string} actorAvatarId
 * @param {{ commit?: boolean, targets?: unknown[] }} [options]
 */
function defaultTargets(engine, state, sideId, card, targets) {
  if (targets !== undefined) return targets;
  const rule = card.targetRule ?? card.Target_Rule;
  if (rule !== 'Enemy') return [];
  const enemyId = Object.keys(state.sides).find((id) => id !== sideId);
  const enemy = state.sides[enemyId];
  const living = (enemy.avatars ?? []).find((avatar) => avatar.hp > 0 && avatar.alive !== false && avatar.defeated !== true);
  if (!living) return [];
  return [living.avatarId];
}

export function playCard(engine, state, sideId, cardId, actorAvatarId, options = {}) {
  const beforeZones = zonesOf(engine, state, sideId);
  const beforeAp = apOf(state, sideId);
  const card = findCard(beforeZones.hand, cardId);
  const commit = options.commit !== false;
  const args = {
    cardInstanceId: card.instanceId,
    actorAvatarId,
    targets: defaultTargets(engine, state, sideId, card, options.targets),
  };
  if (!commit) {
    const snapshot = structuredClone(state);
    const previewZones = structuredClone(beforeZones);
    const preview = typeof engine.previewAction === 'function' ? engine.previewAction(state, args) : engine.playAction(state, { ...args, commit: false });
    assert.notEqual(preview?.ok, false, preview?.reason ?? 'preview failed');
    assert.deepEqual(state, snapshot, 'a preview or cancelled action must not mutate the match');
    assert.deepEqual(zonesOf(engine, state, sideId), previewZones, 'a preview must not move cards');
    assert.equal(apOf(state, sideId), beforeAp, 'cancellation must not spend AP');
    return { result: preview, state, card, beforeAp };
  }
  const result = engine.playAction(state, args);
  if (result && result.ok === false) {
    throw new Error(result.reason ?? 'playAction rejected the card');
  }
  const next = asState(result, state);
  return { result, state: next, card, beforeAp };
}

/**
 * @param {Function} fn
 */
export function expectReject(fn) {
  try {
    const value = fn();
    if (value && typeof value === 'object' && value.ok === false) return value;
    throw new Error('Expected the call to reject an illegal action');
  } catch (error) {
    if (error instanceof Error && error.message === 'Expected the call to reject an illegal action') throw error;
    return error;
  }
}

/**
 * @param {object} config
 * @param {string} key
 */
export function isPendingStatus(status) {
  return status === 'PENDING' || status === 'PENDING_OWNER';
}

function looksLikeFlag(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && typeof value.status === 'string';
}

/**
 * Find a rule flag by key anywhere in defaultRuleConfig().
 * @param {object} config
 * @param {string} key
 */
export function flagOf(config, key) {
  const found = findFlag(config, key);
  if (!found) throw new Error(`defaultRuleConfig is missing flag "${key}" ({ status, value })`);
  return found;
}

function findFlag(node, key) {
  if (!node || typeof node !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(node, key) && looksLikeFlag(node[key])) return node[key];
  for (const value of Object.values(node)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const nested = findFlag(value, key);
    if (nested) return nested;
  }
  return null;
}

/**
 * @param {object} avatar
 */
export function statusesOf(avatar) {
  const list = avatar?.statuses;
  if (!Array.isArray(list)) throw new Error(`avatar ${avatar?.avatarId ?? ''} statuses must be an array`);
  return list;
}

/**
 * @param {object} state
 * @param {string} sideId
 * @param {string} avatarId
 */
export function avatarOf(state, sideId, avatarId) {
  const found = side(state, sideId).avatars?.find((avatar) => avatar.avatarId === avatarId || avatar.instanceId === avatarId);
  if (!found) throw new Error(`avatar ${avatarId} missing on ${sideId}`);
  return found;
}
