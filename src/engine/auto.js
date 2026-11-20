import { orderedCandidates } from './candidates.js';
import { gameError } from './errors.js';
import {
  assessAction,
  discardVoluntary,
  endTurn,
  getOutcome,
  getState,
  playAction,
  resolveEndOfRoundDiscard,
} from './match.js';
import { formulaDamage, isLiving, living, opponentId } from './model.js';

function sideRecord(state, side) {
  const sideId = typeof side === 'string' ? side : side?.sideId;
  const record = sideId ? state.sides?.[sideId] : null;
  if (!record) throw gameError('UNKNOWN_SIDE');
  return record;
}

function policyTable(state, opts) {
  const auto = state.config.autoPolicy;
  const name = opts?.policy ?? auto.name;
  const policy = auto.policies?.[name];
  if (!policy) throw gameError('UNKNOWN_AUTO_POLICY', `Unknown auto policy ${name}`);
  return { name, ...policy };
}

function expandedEffects(card, actor) {
  const effects = [];
  for (const effect of card.effects) {
    if (effect.op === 'trigger_active') {
      if (actor?.active?.effects) effects.push(...actor.active.effects);
    } else {
      effects.push(effect);
    }
  }
  return effects;
}

function effectTags(card, actor) {
  const effects = expandedEffects(card, actor);
  return {
    heal: effects.some((effect) => effect.op === 'regen' || effect.op === 'heal'),
    protect: effects.some((effect) => effect.op === 'shield' || effect.op === 'taunt'),
    damage: effects.some((effect) => effect.op === 'damage'),
    effects,
  };
}

function actionFrom(pair) {
  return {
    cardInstanceId: pair.card.instanceId,
    actorAvatarId: pair.actor.avatarId,
    targets: pair.targets,
  };
}

function legalPlays(state, side) {
  const plays = [];
  for (const pair of orderedCandidates(state, side)) {
    const action = actionFrom(pair);
    const check = assessAction(state, action);
    if (!check.ok) continue;
    const tags = effectTags(pair.card, pair.actor);
    plays.push({ ...pair, action, tags });
  }
  return plays;
}

function allyIsLow(side, ratio) {
  return living(side.avatars).some((unit) => unit.maxHp > 0 && unit.hp / unit.maxHp < ratio);
}

function enemyCanKill(state, side) {
  const enemy = state.sides[opponentId(state, side.sideId)];
  for (const foe of living(enemy.avatars)) {
    for (const ally of living(side.avatars)) {
      const strike = formulaDamage(foe, ally, state.config, 0).amount;
      if (strike >= ally.hp + ally.shield) return true;
    }
  }
  return false;
}

function idOrder(left, right) {
  if (left.card.instanceId !== right.card.instanceId) {
    return left.card.instanceId < right.card.instanceId ? -1 : 1;
  }
  if (left.actor.avatarId !== right.actor.avatarId) {
    return left.actor.avatarId < right.actor.avatarId ? -1 : 1;
  }
  return 0;
}

function damageScore(state, side, play) {
  const enemy = state.sides[opponentId(state, side.sideId)];
  let total = 0;
  let focusHp = Number.POSITIVE_INFINITY;
  for (const effect of play.tags.effects) {
    if (effect.op !== 'damage') continue;
    let victims = [];
    if (effect.target === 'all_enemies' || effect.target === 'all_units') victims = living(enemy.avatars);
    else if (Array.isArray(play.targets) && play.targets.length > 0) {
      victims = play.targets
        .map((avatarId) => enemy.avatars.find((unit) => unit.avatarId === avatarId))
        .filter((unit) => unit && isLiving(unit));
    } else {
      victims = living(enemy.avatars);
    }
    for (const victim of victims) {
      const amount = effect.mode === 'flat' ? effect.amount : formulaDamage(play.actor, victim, state.config, 0).amount;
      total += amount;
      if (victim.hp < focusHp) focusHp = victim.hp;
    }
  }
  return { total, focusHp };
}

function compareDamage(state, side, policy) {
  return (left, right) => {
    const a = damageScore(state, side, left);
    const b = damageScore(state, side, right);
    if (b.total !== a.total) return b.total - a.total;
    if (a.focusHp !== b.focusHp) return a.focusHp - b.focusHp;
    if (policy.spend === 'greedy' && left.card.costAp !== right.card.costAp) {
      return right.card.costAp - left.card.costAp;
    }
    return idOrder(left, right);
  };
}

function compareProtect(left, right) {
  const leftTank = left.actor.role === 'Tank' ? 0 : 1;
  const rightTank = right.actor.role === 'Tank' ? 0 : 1;
  if (leftTank !== rightTank) return leftTank - rightTank;
  return idOrder(left, right);
}

function usefulProtect(play) {
  return play.tags.effects.some((effect) => (effect.op === 'shield' && effect.amount > 0) || effect.op === 'taunt');
}

function nextAttackDelta(state, side, play) {
  const effect = play.tags.effects.find((item) => item.op === 'next_attack' && Number.isInteger(item.amount));
  if (!effect) return 0;
  const foes = living(state.sides[opponentId(state, side.sideId)].avatars);
  if (foes.length === 0) return 0;
  const victim = foes.reduce((lowest, unit) => (unit.hp < lowest.hp ? unit : lowest));
  const before = formulaDamage(play.actor, victim, state.config, 0).amount;
  play.actor.statuses.push({ kind: 'next_attack', stat: 'atk', amount: effect.amount });
  const after = formulaDamage(play.actor, victim, state.config, 0).amount;
  play.actor.statuses.pop();
  return Math.max(0, after - before);
}

function expectedValue(state, side, play, policy) {
  const dealt = play.tags.damage ? damageScore(state, side, play).total : 0;
  let extra = 0;
  const lethal = enemyCanKill(state, side);
  if (play.tags.effects.some((effect) => effect.op === 'next_attack')) extra += nextAttackDelta(state, side, play);
  for (const effect of play.tags.effects) {
    if (effect.op === 'next_attack') continue;
    if (effect.op === 'regen' || effect.op === 'heal') {
      extra += 0;
    } else if (effect.op === 'buff' && effect.stat === 'atk' && Number.isInteger(effect.amount)) extra += effect.amount;
    else if (effect.op === 'shield' && lethal && Number.isInteger(effect.amount) && effect.amount > 0) extra += effect.amount;
    else if (effect.op === 'taunt' && lethal) extra += 1;
    else if (effect.op === 'draw') extra += effect.count ?? 1;
  }
  return dealt + extra;
}

function compareExpected(state, side, policy) {
  return (left, right) => {
    const delta = expectedValue(state, side, right, policy) - expectedValue(state, side, left, policy);
    if (delta !== 0) return delta;
    const leftHp = left.tags.damage ? damageScore(state, side, left).focusHp : Number.POSITIVE_INFINITY;
    const rightHp = right.tags.damage ? damageScore(state, side, right).focusHp : Number.POSITIVE_INFINITY;
    if (leftHp !== rightHp) return leftHp - rightHp;
    if (policy.spend === 'greedy' && left.card.costAp !== right.card.costAp) return right.card.costAp - left.card.costAp;
    return idOrder(left, right);
  };
}

function improvesTheHit(state, side, play, plays) {
  if (nextAttackDelta(state, side, play) <= 0) return false;
  const follow = plays.filter((other) => other.tags.damage
    && other.actor.avatarId === play.actor.avatarId
    && other.card.instanceId !== play.card.instanceId
    && other.card.costAp <= side.ap - play.card.costAp);
  if (follow.length === 0) return false;
  const bestNow = plays.filter((other) => other.tags.damage).reduce((best, other) => Math.max(best, damageScore(state, side, other).total), 0);
  const actorNow = follow.reduce((best, other) => Math.max(best, damageScore(state, side, other).total), 0);
  return actorNow + nextAttackDelta(state, side, play) > bestNow;
}

function pickPlay(state, side, policy) {
  const plays = legalPlays(state, side);
  for (const step of policy.priorities) {
    if (step === 'heal_regen' && !allyIsLow(side, policy.allyLowHpRatio)) continue;
    if (step === 'shield_taunt_if_lethal' && !enemyCanKill(state, side)) continue;
    let matching = [];
    if (step === 'heal_regen') {
      matching = plays.filter((play) => play.tags.heal && !plays.some((other) => other.tags.damage)
        && !play.tags.effects.some((effect) => effect.op === 'regen'));
    }
    else if (step === 'shield_taunt_if_lethal') matching = plays.filter((play) => usefulProtect(play));
    else if (step === 'setup_next_attack') matching = plays.filter((play) => improvesTheHit(state, side, play, plays));
    else if (step === 'highest_damage_lowest_hp') matching = plays.filter((play) => play.tags.damage);
    else if (step === 'any_legal_expected_value') matching = plays.filter((play) => expectedValue(state, side, play, policy) > 0);
    if (matching.length === 0) continue;
    if (step === 'heal_regen') matching.sort(idOrder);
    else if (step === 'shield_taunt_if_lethal') matching.sort(compareProtect);
    else if (step === 'setup_next_attack' || step === 'any_legal_expected_value') matching.sort(compareExpected(state, side, policy));
    else matching.sort(compareDamage(state, side, policy));
    const chosen = matching[0];
    return {
      kind: 'play',
      priority: step,
      cardInstanceId: chosen.card.instanceId,
      cardId: chosen.card.cardId,
      actorAvatarId: chosen.actor.avatarId,
      targets: chosen.targets,
      cost: chosen.card.costAp,
    };
  }
  return null;
}

function cardIsHandLocked(state, side, card) {
  if (card.handLocked === true || card.lockedInHand === true) return true;
  const copy = getState(state);
  const mirrored = copy.sides[side.sideId];
  mirrored.ap = Math.max(mirrored.ap ?? 0, card.costAp, copy.config.baseAp.value);
  return !orderedCandidates(copy, mirrored)
    .filter((pair) => pair.card.instanceId === card.instanceId)
    .some((pair) => assessAction(copy, actionFrom(pair)).ok);
}

function cardHasProgress(state, side, policy, card) {
  const copy = getState(state);
  const mirrored = copy.sides[side.sideId];
  mirrored.ap = Math.max(mirrored.ap ?? 0, card.costAp, copy.config.baseAp.value);
  return legalPlays(copy, mirrored)
    .filter((play) => play.card.instanceId === card.instanceId)
    .some((play) => expectedValue(copy, mirrored, play, policy) > 0);
}

function pickDiscard(state, side, policy) {
  const mode = policy.voluntaryDiscard;
  if (mode !== 'hand_locked_only' && mode !== 'hand_locked_or_no_progress') return null;
  if ((side.ap ?? 0) < state.config.voluntaryDiscardAp.value) return null;
  const plays = legalPlays(state, side);
  if (plays.some((play) => expectedValue(state, side, play, policy) > 0)) return null;
  const byInstance = (left, right) => (left.instanceId < right.instanceId ? -1 : left.instanceId > right.instanceId ? 1 : 0);
  const locked = [...side.zones.hand].filter((card) => cardIsHandLocked(state, side, card)).sort(byInstance);
  const stalled = mode === 'hand_locked_or_no_progress'
    ? [...side.zones.hand].filter((card) => !cardHasProgress(state, side, policy, card)).sort(byInstance)
    : [];
  const chosen = locked[0] ?? stalled[0];
  if (!chosen) return null;
  return {
    kind: 'discard_voluntary',
    priority: locked[0] ? 'hand_locked_only' : 'no_progress',
    cardInstanceId: chosen.instanceId,
    cardId: chosen.cardId,
    actorAvatarId: null,
    targets: null,
    cost: state.config.voluntaryDiscardAp.value,
  };
}

function nextAction(state, side, policy) {
  return pickPlay(state, side, policy) ?? pickDiscard(state, side, policy);
}

function applyPlanned(state, planned) {
  if (planned.kind === 'discard_voluntary') {
    const checkAp = state.sides[state.activeSideId]?.ap ?? 0;
    if (checkAp < planned.cost) return { ok: false, reason: 'INSUFFICIENT_AP' };
    return discardVoluntary(state, planned.cardInstanceId);
  }
  const check = assessAction(state, planned);
  if (!check.ok) return check;
  return playAction(state, planned);
}

/**
 * Ordered legal actions for this side's current turn. Does not change `state`.
 * @param {object} state
 * @param {string | { sideId: string }} side
 * @param {{ policy?: string, maxActions?: number }} [opts]
 */
export function chooseAutoActions(state, side, opts) {
  const record = sideRecord(state, side);
  if (state.outcome?.status === 'decided') return [];
  if (state.phase !== 'action' || state.activeSideId !== record.sideId) return [];
  const policy = policyTable(state, opts);
  const copy = getState(state);
  const planned = [];
  const cap = Number.isInteger(opts?.maxActions) ? opts.maxActions : 40;
  for (let guard = 0; guard < cap; guard += 1) {
    const mirrored = copy.sides[record.sideId];
    const action = nextAction(copy, mirrored, policy);
    if (!action) break;
    const result = applyPlanned(copy, action);
    if (!result.ok) break;
    planned.push(action);
    if (copy.outcome.status === 'decided') break;
  }
  return planned;
}

function stopNow(opts, played) {
  if (Number.isInteger(opts?.maxActions) && played >= opts.maxActions) return true;
  if (typeof opts?.shouldStop === 'function' && opts.shouldStop() === true) return true;
  return false;
}

function mandatoryDiscard(state, sideId) {
  const side = state.sides[sideId];
  const excess = side.zones.hand.length - state.config.handSize.value;
  if (excess <= 0) return null;
  const ids = [...side.zones.hand]
    .sort((left, right) => (left.instanceId < right.instanceId ? -1 : left.instanceId > right.instanceId ? 1 : 0))
    .slice(0, excess)
    .map((card) => card.instanceId);
  const result = resolveEndOfRoundDiscard(state, ids);
  return {
    kind: 'mandatory_discard',
    priority: null,
    cardInstanceId: null,
    cardId: null,
    actorAvatarId: null,
    targets: null,
    instanceIds: ids,
    cost: 0,
    apSpent: 0,
    ok: result.ok === true,
    reason: result.reason ?? null,
  };
}

function pack(state, extra) {
  return { state, outcome: getOutcome(state), ...extra };
}

/**
 * Play the planned actions, then end the turn unless the caller stops between actions.
 * The match object is updated in place and returned for the UI.
 * @param {object} state
 * @param {string | { sideId: string }} side
 * @param {{ policy?: string, maxActions?: number, shouldStop?: () => boolean }} [opts]
 */
export function runAutoTurn(state, side, opts) {
  const record = sideRecord(state, side);
  if (state.outcome.status === 'decided') {
    return pack(state, { ok: false, reason: 'BATTLE_DECIDED', log: [], actions: [], stopped: false, ended: false });
  }
  if (state.phase === 'end_of_round_discard') {
    const entry = mandatoryDiscard(state, record.sideId);
    const log = entry ? [entry] : [];
    if (entry && !entry.ok) {
      return pack(state, { ok: false, reason: entry.reason, log, actions: [], stopped: false, ended: false });
    }
    return pack(state, { ok: true, reason: null, log, actions: [], stopped: false, ended: false });
  }
  if (state.phase !== 'action' || state.activeSideId !== record.sideId) {
    return pack(state, { ok: false, reason: 'NOT_ACTIVE_SIDE', log: [], actions: [], stopped: false, ended: false });
  }
  const actions = chooseAutoActions(state, record.sideId, opts?.maxActions === undefined ? opts : { policy: opts.policy });
  const log = [];
  let played = 0;
  for (const planned of actions) {
    if (stopNow(opts, played)) {
      return pack(state, { ok: true, reason: null, log, actions, stopped: true, ended: false });
    }
    const apBefore = state.sides[record.sideId].ap;
    const result = applyPlanned(state, planned);
    if (!result.ok) {
      return pack(state, {
        ok: true,
        reason: null,
        log,
        actions,
        stopped: true,
        ended: false,
        skipped: { ...planned, ok: false, reason: result.reason },
      });
    }
    log.push({ ...planned, ok: true, reason: null, apBefore, apAfter: result.ap ?? state.sides[record.sideId].ap });
    played += 1;
    if (state.outcome.status === 'decided') {
      return pack(state, { ok: true, reason: null, log, actions, stopped: false, ended: false });
    }
  }
  if (stopNow(opts, played) && played < actions.length) {
    return pack(state, { ok: true, reason: null, log, actions, stopped: true, ended: false });
  }
  if (typeof opts?.shouldStop === 'function' && opts.shouldStop() === true) {
    return pack(state, { ok: true, reason: null, log, actions, stopped: true, ended: false });
  }
  const ended = endTurn(state);
  log.push({
    kind: 'end_turn',
    priority: null,
    cardInstanceId: null,
    cardId: null,
    actorAvatarId: null,
    targets: null,
    cost: 0,
    ok: ended.ok === true,
    reason: ended.reason ?? null,
    apBefore: null,
    apAfter: state.sides[state.activeSideId]?.ap ?? null,
  });
  if (state.phase === 'end_of_round_discard') {
    const entry = mandatoryDiscard(state, record.sideId);
    if (entry) log.push(entry);
  }
  return pack(state, { ok: true, reason: null, log, actions, stopped: false, ended: ended.ok === true });
}

/**
 * AUTO turn for the enemy side. A human side is the one with control `human`;
 * otherwise the second team is the enemy. SYNC is not implemented.
 * @param {object} state
 * @param {{ policy?: string, maxActions?: number, shouldStop?: () => boolean }} [opts]
 */
export function playEnemyTurn(state, opts) {
  const humanId = state.sideOrder.find((id) => state.sides[id].control === 'human');
  const enemyId = humanId
    ? state.sideOrder.find((id) => id !== humanId)
    : state.sideOrder[1];
  return runAutoTurn(state, enemyId, opts);
}
