import { gameError } from './errors.js';
import { hashSeed, shuffleInPlace } from './rng.js';
import { resolveRuleConfig } from './rule-config.js';
import {
  aggregateTeamSpd,
  checkOutcome,
  chooseStarter,
  findUnit,
  getState,
  isLiving,
  living,
  locateInstance,
  normalizeAvatar,
  normalizeCard,
  ongoingOutcome,
  opponentId,
  permitMatches,
  pullCard,
  withRng,
  writeState,
} from './model.js';
import {
  expireEndStatuses,
  expireStartStatuses,
  fireTurnPassives,
  refillHand,
  resolveEffects,
  tickRegen,
} from './resolve.js';

export { getState };

function failure(state, reason, extra = {}) {
  return { ok: false, reason, ...extra, outcome: outcomeOf(state) };
}

function outcomeOf(state) {
  return JSON.parse(JSON.stringify(state.outcome));
}

export function getOutcome(state) {
  return outcomeOf(state);
}

export function getZones(state, sideId) {
  const side = state.sides?.[sideId];
  if (!side) throw gameError('UNKNOWN_SIDE', `Unknown side ${sideId}`);
  return {
    draw: JSON.parse(JSON.stringify(side.zones.draw)),
    hand: JSON.parse(JSON.stringify(side.zones.hand)),
    discard: JSON.parse(JSON.stringify(side.zones.discard)),
    void: JSON.parse(JSON.stringify(side.zones.void)),
  };
}

function deckList(input, team, index) {
  if (Array.isArray(input.decks)) return input.decks[index];
  if (input.decks && typeof input.decks === 'object') return input.decks[team.sideId];
  return undefined;
}

function excessList(state) {
  const cap = state.config.handSize.value;
  const rows = [];
  for (const sideId of state.sideOrder) {
    const handSize = state.sides[sideId].zones.hand.length;
    if (handSize > cap) rows.push({ sideId, excess: handSize - cap, handSize });
  }
  return rows;
}

function beginTurn(state) {
  if (state.turnStarted) return;
  const side = state.sides[state.activeSideId];
  withRng(state, (rng) => {
    expireStartStatuses(state, side);
    tickRegen(state, side);
    fireTurnPassives(state, side, rng);
    refillHand(state, side, rng);
  });
  side.ap = state.config.baseAp.value;
  state.turnStarted = true;
  state.log.push({
    type: 'turn_start',
    sideId: side.sideId,
    turnIndex: state.turnIndex,
    roundIndex: state.roundIndex,
    ap: side.ap,
    handSize: side.zones.hand.length,
  });
}

function advanceTo(state, nextSideId) {
  state.phase = 'action';
  state.pendingNextSideId = null;
  state.activeSideId = nextSideId;
  state.turnIndex += 1;
  if (nextSideId === state.startingSideId) state.roundIndex += 1;
  state.turnStarted = false;
  beginTurn(state);
}

/**
 * @param {object} input
 */
export function createMatch(input) {
  if (!input || typeof input !== 'object') throw gameError('MATCH_INPUT', 'createMatch input is required');
  if (input.seed === undefined || input.seed === null) throw gameError('SEED_REQUIRED');
  const config = resolveRuleConfig(input.config);
  const teams = input.teams;
  if (!Array.isArray(teams) || teams.length !== 2) throw gameError('SIDE_COUNT', 'a match has two sides');
  const seed = hashSeed(input.seed);
  const sideOrder = [];
  const sides = {};
  for (let index = 0; index < teams.length; index += 1) {
    const team = teams[index];
    if (!team || typeof team.sideId !== 'string' || team.sideId.length === 0) throw gameError('SIDE_ID');
    if (sideOrder.includes(team.sideId)) throw gameError('SIDE_ID', 'side ids must be different');
    if (!Array.isArray(team.avatars) || team.avatars.length !== config.partySize.value) {
      throw gameError('PARTY_SIZE', `${team.sideId} needs ${config.partySize.value} avatars`);
    }
    const control = team.control ?? 'human';
    if (control !== 'human' && control !== 'ai') throw gameError('UNKNOWN_CONTROL');
    const seen = new Set();
    const avatars = team.avatars.map((avatar) => {
      const unit = normalizeAvatar(avatar, config, team.sideId);
      if (seen.has(unit.avatarId)) throw gameError('DUPLICATE_AVATAR', unit.avatarId);
      seen.add(unit.avatarId);
      return unit;
    });
    if (avatars.every((unit) => !isLiving(unit))) throw gameError('SIDE_ALREADY_DEFEATED', team.sideId);
    const rawDeck = deckList(input, team, index);
    if (!Array.isArray(rawDeck) || rawDeck.length !== config.deckSize.value) {
      throw gameError('DECK_SIZE', `${team.sideId} deck must be ${config.deckSize.value} action cards`);
    }
    if (Number.isInteger(config.deckDuplicateMax.value)) {
      const counts = new Map();
      for (const raw of rawDeck) {
        const cardId = raw?.cardId ?? raw?.Action_ID;
        const next = (counts.get(cardId) ?? 0) + 1;
        counts.set(cardId, next);
        if (next > config.deckDuplicateMax.value) throw gameError('DUPLICATE_CAP', String(cardId));
      }
    }
    const cards = rawDeck.map((raw, cardIndex) => normalizeCard(raw, `${team.sideId}#${String(cardIndex).padStart(3, '0')}`));
    sideOrder.push(team.sideId);
    sides[team.sideId] = {
      sideId: team.sideId,
      control,
      ap: null,
      teamSpd: aggregateTeamSpd(avatars, config.teamSpd.aggregation),
      teamSpdStatus: 'PENDING_OWNER',
      avatars,
      zones: { draw: cards, hand: [], discard: [], void: [] },
    };
  }
  const state = {
    matchId: typeof input.matchId === 'string' && input.matchId.length > 0 ? input.matchId : `match-${seed}`,
    seed,
    rngState: seed,
    ruleset: 'v0.5',
    productionReady: false,
    apiVersion: 1,
    config,
    flags: {
      productionReady: false,
      teamSpd: 'PENDING_OWNER',
      spdTieBreak: 'PENDING_OWNER',
      damageFormula: 'PENDING_OWNER',
      hp: 'PENDING_OWNER',
      healCap: 'PENDING_OWNER',
      regenTickTiming: 'PENDING_OWNER',
      simultaneousDeath: 'PENDING_OWNER',
      deckDuplicateMax: 'PENDING_OWNER',
      statusExpiry: 'PENDING_OWNER',
    },
    phase: 'action',
    roundIndex: 1,
    turnIndex: 1,
    turnStarted: false,
    startingSideId: null,
    activeSideId: null,
    pendingNextSideId: null,
    sideOrder,
    sides,
    pendingAction: null,
    nextStatusId: 0,
    log: [],
    outcome: ongoingOutcome(),
    rewards: null,
  };
  withRng(state, (rng) => {
    if (input.shuffleDecks !== false) {
      for (const sideId of sideOrder) shuffleInPlace(sides[sideId].zones.draw, rng);
    }
    for (const sideId of sideOrder) {
      const side = sides[sideId];
      const drawn = [];
      for (let count = 0; count < config.openingHand.value; count += 1) {
        const card = pullCard(state, side, rng);
        if (!card) break;
        side.zones.hand.push(card);
        drawn.push(card.instanceId);
      }
      state.log.push({ type: 'opening_hand', sideId, instanceIds: drawn });
    }
  });
  const starter = chooseStarter(state);
  state.startingSideId = starter.startingSideId;
  state.activeSideId = starter.startingSideId;
  state.log.push({
    type: 'battle_start',
    matchId: state.matchId,
    seed,
    startingSideId: starter.startingSideId,
    tieBreakUsed: starter.tieBreakUsed,
    teamSpd: {
      [sideOrder[0]]: sides[sideOrder[0]].teamSpd,
      [sideOrder[1]]: sides[sideOrder[1]].teamSpd,
    },
    teamSpdStatus: 'PENDING_OWNER',
    tieBreakStatus: 'PENDING_OWNER',
    placeholder: true,
  });
  beginTurn(state);
  checkOutcome(state);
  return state;
}

export function startTurn(state) {
  if (state.outcome.status === 'decided') return failure(state, 'BATTLE_DECIDED');
  if (state.phase !== 'action') return failure(state, 'WRONG_PHASE');
  if (state.turnStarted) {
    const side = state.sides[state.activeSideId];
    return {
      ok: true,
      alreadyStarted: true,
      activeSideId: state.activeSideId,
      ap: side.ap,
      turnIndex: state.turnIndex,
      roundIndex: state.roundIndex,
      outcome: outcomeOf(state),
    };
  }
  beginTurn(state);
  const side = state.sides[state.activeSideId];
  return {
    ok: true,
    alreadyStarted: false,
    activeSideId: state.activeSideId,
    ap: side.ap,
    turnIndex: state.turnIndex,
    roundIndex: state.roundIndex,
    outcome: outcomeOf(state),
  };
}

function normalizeTargets(targets) {
  if (!targets) return { avatarIds: [], retrieveInstanceIds: [] };
  if (Array.isArray(targets)) return { avatarIds: targets.map(String), retrieveInstanceIds: [] };
  return {
    avatarIds: [...(targets.avatarIds ?? [])].map(String),
    retrieveInstanceIds: [...(targets.retrieveInstanceIds ?? [])].map(String),
  };
}

function factionOk(card, actor, side) {
  if (!card.factionRequirement || card.factionOverride) return true;
  if (actor.faction !== card.factionRequirement) return false;
  return side.avatars.some((unit) => unit.faction === card.factionRequirement);
}

function resolveActors(side, card, action) {
  const listed = Array.isArray(action.actorAvatarIds) && action.actorAvatarIds.length > 0
    ? action.actorAvatarIds.map(String)
    : (action.actorAvatarId ? [String(action.actorAvatarId)] : []);
  const pureTrigger = card.type === 'Skill'
    && card.effects.length > 0
    && card.effects.every((effect) => effect.op === 'trigger_active');
  const expected = pureTrigger ? card.skillTargetCount : 1;
  if (listed.length === 0) return { ok: false, reason: 'ACTOR_REQUIRED' };
  if (listed.length !== expected) return { ok: false, reason: 'ACTOR_COUNT' };
  const actors = [];
  for (const avatarId of listed) {
    const unit = findUnit(side, avatarId);
    if (!unit) return { ok: false, reason: 'ACTOR_ILLEGAL' };
    if (!isLiving(unit)) return { ok: false, reason: 'ACTOR_DEAD' };
    if (!factionOk(card, unit, side)) return { ok: false, reason: 'FACTION_GATE' };
    if (card.effects.some((effect) => effect.op === 'trigger_active') && !unit.active) {
      return { ok: false, reason: 'NO_ACTIVE' };
    }
    actors.push(unit);
  }
  return { ok: true, actors, pureTrigger };
}

function chooseTargets(state, side, actor, card, avatarIds) {
  const enemy = state.sides[opponentId(state, side.sideId)];
  if (card.targetRule === 'Self' || card.targetRule === 'All_Allies' || card.targetRule === 'All_Enemies' || card.targetRule === 'Pile' || card.targetRule === 'Card') {
    if (card.targetRule === 'Self') {
      if (avatarIds.length > 0 && (avatarIds.length !== 1 || avatarIds[0] !== actor.avatarId)) {
        return { ok: false, reason: 'TARGET_ILLEGAL' };
      }
      return { ok: true, chosen: [actor] };
    }
    if (card.targetRule === 'All_Allies') return { ok: true, chosen: living(side.avatars) };
    if (card.targetRule === 'All_Enemies') {
      const chosen = living(enemy.avatars);
      if (chosen.length === 0) return { ok: false, reason: 'TARGET_ILLEGAL' };
      return { ok: true, chosen };
    }
    return { ok: true, chosen: [] };
  }
  if (card.targetRule === 'Ally') {
    if (avatarIds.length !== 1) return { ok: false, reason: 'TARGET_REQUIRED' };
    const unit = findUnit(side, avatarIds[0]);
    if (!unit || !isLiving(unit)) return { ok: false, reason: 'TARGET_ILLEGAL' };
    return { ok: true, chosen: [unit] };
  }
  if (card.targetRule === 'Enemy') {
    if (avatarIds.length !== 1) return { ok: false, reason: 'TARGET_REQUIRED' };
    const unit = findUnit(enemy, avatarIds[0]);
    if (!unit || !isLiving(unit)) return { ok: false, reason: 'TARGET_ILLEGAL' };
    const taunters = living(enemy.avatars).filter((candidate) => candidate.statuses.some((status) => status.kind === 'taunt'));
    if (taunters.length > 0 && !taunters.some((candidate) => candidate.avatarId === unit.avatarId)) {
      return { ok: false, reason: 'TAUNT' };
    }
    return { ok: true, chosen: [unit] };
  }
  return { ok: false, reason: 'UNKNOWN_TARGET_RULE' };
}

function validateRetrieve(side, card, ids) {
  const effect = card.effects.find((item) => item.op === 'retrieve');
  if (!effect) return { ok: true };
  const count = effect.count ?? 1;
  if (ids.length !== count) return { ok: false, reason: 'RETRIEVE_COUNT' };
  if (new Set(ids).size !== ids.length) return { ok: false, reason: 'DUPLICATE_INSTANCE' };
  const pile = side.zones[effect.pile];
  for (const instanceId of ids) {
    const found = pile.find((item) => item.instanceId === instanceId);
    if (!found) return { ok: false, reason: 'NOT_IN_PILE' };
    if (!permitMatches(found, effect.permit)) return { ok: false, reason: 'RETRIEVE_PERMIT' };
  }
  return { ok: true };
}

function legalAction(state, action, { requireTargets }) {
  if (state.outcome.status === 'decided') return { ok: false, reason: 'BATTLE_DECIDED' };
  if (state.phase !== 'action') return { ok: false, reason: 'WRONG_PHASE' };
  if (!action || typeof action.cardInstanceId !== 'string') return { ok: false, reason: 'NOT_IN_HAND' };
  const located = locateInstance(state, action.cardInstanceId);
  if (!located) return { ok: false, reason: 'NOT_IN_HAND' };
  if (located.side.sideId !== state.activeSideId) return { ok: false, reason: 'NOT_ACTIVE_SIDE' };
  if (located.zoneName !== 'hand') return { ok: false, reason: 'NOT_IN_HAND' };
  const side = located.side;
  const card = located.card;
  if (side.ap === null) return { ok: false, reason: 'AP_UNAVAILABLE' };
  if (card.costAp > side.ap) return { ok: false, reason: 'INSUFFICIENT_AP', cost: card.costAp, ap: side.ap };
  const actors = resolveActors(side, card, action);
  if (!actors.ok) return actors;
  const requested = normalizeTargets(action.targets);
  if (!requireTargets || actors.pureTrigger) {
    return { ok: true, side, card, index: located.index, actors: actors.actors, chosen: [], retrieveInstanceIds: requested.retrieveInstanceIds, pureTrigger: actors.pureTrigger };
  }
  const targets = chooseTargets(state, side, actors.actors[0], card, requested.avatarIds);
  if (!targets.ok) return { ...targets, cost: card.costAp, ap: side.ap };
  const retrieved = validateRetrieve(side, card, requested.retrieveInstanceIds);
  if (!retrieved.ok) return { ...retrieved, cost: card.costAp, ap: side.ap };
  return {
    ok: true,
    side,
    card,
    index: located.index,
    actors: actors.actors,
    chosen: targets.chosen,
    retrieveInstanceIds: requested.retrieveInstanceIds,
    pureTrigger: false,
  };
}

export function previewAction(state, action) {
  const copy = getState(state);
  const played = playAction(copy, action);
  return {
    ok: played.ok,
    reason: played.reason ?? null,
    cost: played.cost ?? null,
    ap: played.ap ?? null,
    zone: played.zone ?? null,
  };
}

export function armAction(state, action) {
  const check = legalAction(state, action ?? {}, { requireTargets: false });
  if (!check.ok) return failure(state, check.reason, { cost: check.cost ?? null, ap: state.sides[state.activeSideId]?.ap ?? null, apSpent: 0 });
  state.pendingAction = {
    cardInstanceId: check.card.instanceId,
    actorAvatarId: check.actors[0].avatarId,
    apSpent: 0,
  };
  return {
    ok: true,
    pending: true,
    apSpent: 0,
    ap: check.side.ap,
    cardInstanceId: check.card.instanceId,
    outcome: outcomeOf(state),
  };
}

export function cancelAction(state) {
  const ap = state.sides[state.activeSideId]?.ap ?? null;
  if (!state.pendingAction) return { ok: true, apSpent: 0, ap, reason: 'NOTHING_TO_CANCEL', outcome: outcomeOf(state) };
  state.pendingAction = null;
  state.log.push({ type: 'action_cancelled', apSpent: 0, turnIndex: state.turnIndex, sideId: state.activeSideId });
  return { ok: true, apSpent: 0, ap, reason: null, outcome: outcomeOf(state) };
}

export function playAction(state, action) {
  const check = legalAction(state, action ?? {}, { requireTargets: true });
  if (!check.ok) return failure(state, check.reason, { cost: check.cost ?? null, ap: state.sides[state.activeSideId]?.ap ?? null });
  const snapshot = getState(state);
  try {
    const { side, card } = check;
    state.pendingAction = null;
    side.ap -= card.costAp;
    side.zones.hand.splice(check.index, 1);
    withRng(state, (rng) => {
      for (const actor of check.actors) {
        resolveEffects(state, {
          state,
          rng,
          side,
          actor,
          card,
          chosen: check.chosen,
          randomAlly: null,
          retrieveInstanceIds: check.retrieveInstanceIds,
          activeDepth: 0,
          dealtDamage: false,
          bonusRolled: false,
          bonus: 0,
        }, card.effects, card);
      }
    });
    side.zones[card.onResolveZone].push(card);
    state.log.push({
      type: 'play',
      sideId: side.sideId,
      cardInstanceId: card.instanceId,
      cardId: card.cardId,
      actionType: card.type,
      cost: card.costAp,
      ap: side.ap,
      zone: card.onResolveZone,
      turnIndex: state.turnIndex,
      actorAvatarId: check.actors[0].avatarId,
    });
    checkOutcome(state);
    return {
      ok: true,
      cardInstanceId: card.instanceId,
      actorAvatarId: check.actors[0].avatarId,
      actorAvatarIds: check.actors.map((unit) => unit.avatarId),
      cost: card.costAp,
      ap: side.ap,
      zone: card.onResolveZone,
      outcome: outcomeOf(state),
    };
  } catch (error) {
    writeState(state, snapshot);
    throw error;
  }
}

export function discardVoluntary(state, cardInstanceId) {
  if (state.outcome.status === 'decided') return failure(state, 'BATTLE_DECIDED');
  if (state.phase !== 'action') return failure(state, 'WRONG_PHASE');
  const located = locateInstance(state, cardInstanceId);
  if (!located) return failure(state, 'NOT_IN_HAND');
  if (located.side.sideId !== state.activeSideId) return failure(state, 'NOT_ACTIVE_SIDE');
  if (located.zoneName !== 'hand') return failure(state, 'NOT_IN_HAND');
  const side = located.side;
  const cost = state.config.voluntaryDiscardAp.value;
  if (side.ap === null || side.ap < cost) return failure(state, 'INSUFFICIENT_AP', { ap: side.ap, cost });
  side.ap -= cost;
  const [card] = side.zones.hand.splice(located.index, 1);
  side.zones.discard.push(card);
  state.pendingAction = state.pendingAction?.cardInstanceId === card.instanceId ? null : state.pendingAction;
  state.log.push({
    type: 'voluntary_discard',
    sideId: side.sideId,
    cardInstanceId: card.instanceId,
    apSpent: cost,
    ap: side.ap,
    turnIndex: state.turnIndex,
  });
  return { ok: true, apSpent: cost, ap: side.ap, cardInstanceId: card.instanceId, outcome: outcomeOf(state) };
}

export function endTurn(state) {
  if (state.outcome.status === 'decided') return failure(state, 'BATTLE_DECIDED');
  if (state.phase !== 'action') return failure(state, 'WRONG_PHASE');
  if (state.pendingAction) {
    state.pendingAction = null;
    state.log.push({ type: 'action_cancelled', apSpent: 0, turnIndex: state.turnIndex, sideId: state.activeSideId });
  }
  const finished = state.sides[state.activeSideId];
  expireEndStatuses(state, finished);
  state.log.push({ type: 'turn_end', sideId: finished.sideId, turnIndex: state.turnIndex, ap: finished.ap });
  const next = opponentId(state, finished.sideId);
  if (next === state.startingSideId && excessList(state).length > 0) {
    state.phase = 'end_of_round_discard';
    state.pendingNextSideId = next;
    state.turnStarted = false;
    return {
      ok: true,
      activeSideId: state.activeSideId,
      phase: state.phase,
      ap: finished.ap,
      turnIndex: state.turnIndex,
      roundIndex: state.roundIndex,
      needsDiscard: excessList(state),
      outcome: outcomeOf(state),
    };
  }
  advanceTo(state, next);
  const active = state.sides[state.activeSideId];
  return {
    ok: true,
    activeSideId: state.activeSideId,
    phase: state.phase,
    ap: active.ap,
    turnIndex: state.turnIndex,
    roundIndex: state.roundIndex,
    needsDiscard: [],
    outcome: outcomeOf(state),
  };
}

export function resolveEndOfRoundDiscard(state, cardInstanceIds) {
  if (state.outcome.status === 'decided') return failure(state, 'BATTLE_DECIDED');
  if (state.phase !== 'end_of_round_discard') return failure(state, 'WRONG_PHASE');
  if (!Array.isArray(cardInstanceIds)) return failure(state, 'DISCARD_COUNT');
  const ids = cardInstanceIds.map(String);
  if (new Set(ids).size !== ids.length) return failure(state, 'DUPLICATE_INSTANCE');
  const cap = state.config.handSize.value;
  const grouped = new Map();
  for (const instanceId of ids) {
    const located = locateInstance(state, instanceId);
    if (!located || located.zoneName !== 'hand') return failure(state, 'NOT_IN_HAND');
    const list = grouped.get(located.side.sideId) ?? [];
    list.push(located);
    grouped.set(located.side.sideId, list);
  }
  for (const sideId of state.sideOrder) {
    const side = state.sides[sideId];
    const excess = side.zones.hand.length - cap;
    const provided = grouped.get(sideId)?.length ?? 0;
    if (excess <= 0 && provided > 0) return failure(state, 'DISCARD_COUNT', { sideId, excess: 0, provided });
    if (excess > 0 && provided !== 0 && provided !== excess) {
      return failure(state, 'DISCARD_COUNT', { sideId, excess, provided });
    }
  }
  if ([...grouped.values()].every((list) => list.length === 0)) return failure(state, 'DISCARD_COUNT');
  const apBefore = {};
  for (const sideId of state.sideOrder) apBefore[sideId] = state.sides[sideId].ap;
  for (const [sideId, rows] of grouped) {
    const side = state.sides[sideId];
    const dropping = new Set(rows.map((row) => row.card.instanceId));
    const kept = [];
    const discarded = [];
    for (const card of side.zones.hand) {
      if (dropping.has(card.instanceId)) discarded.push(card);
      else kept.push(card);
    }
    side.zones.hand = kept;
    side.zones.discard.push(...discarded);
    state.log.push({
      type: 'mandatory_discard',
      sideId,
      instanceIds: discarded.map((card) => card.instanceId),
      apSpent: 0,
      handSize: side.zones.hand.length,
    });
  }
  for (const sideId of state.sideOrder) state.sides[sideId].ap = apBefore[sideId];
  if (excessList(state).length === 0) advanceTo(state, state.pendingNextSideId);
  return {
    ok: true,
    phase: state.phase,
    apSpent: 0,
    activeSideId: state.activeSideId,
    needsDiscard: excessList(state),
    outcome: outcomeOf(state),
  };
}
