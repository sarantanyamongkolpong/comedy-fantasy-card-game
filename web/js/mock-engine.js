/**
 * MOCK fallback for the v0.5 engine/data/gacha/save contract.
 *
 * Used only when src/engine, src/config, src/gacha, and src/save do not export
 * the agreed API yet. This is not the battle engine. It is not PRODUCTION_READY.
 *
 * LOCKED rules are implemented (4 avatars, 5 AP, 30-card decks supplied by the
 * caller, hand 5, voluntary discard 1 AP, free discard down to 5, manual end,
 * Discard vs Void, recycle Discard only, FAC gate, Skill card fires Active).
 *
 * PENDING numbers live on defaultRuleConfig() and are labelled in the log.
 * The stand-in HP and damage formula exist so a SAMPLE fight can finish.
 * They are not design values.
 */

import { factionName } from './sample-catalog.js';

export const MOCK_SOURCE = 'mock';

const HAND_MAX = 5;
const BASE_AP = 5;

export function defaultRuleConfig() {
  return {
    source: MOCK_SOURCE,
    productionReady: false,
    deckSize: { value: 30, status: 'LOCKED', rule: 'CORE-009' },
    handSize: { value: HAND_MAX, status: 'LOCKED', rule: 'CORE-010' },
    baseAp: { value: BASE_AP, status: 'LOCKED', rule: 'CORE-007' },
    voluntaryDiscardAp: { value: 1, status: 'LOCKED', rule: 'CORE-014' },
    partySize: { value: 4, status: 'LOCKED', rule: 'CORE-003' },
    teamSpdAggregation: {
      status: 'PENDING',
      rule: 'CORE-038',
      provisional: 'SUM',
      note: 'Team SPD is the sum of avatar SPD. Not a locked formula.',
    },
    spdTieBreak: {
      status: 'PENDING',
      rule: 'CORE-038',
      provisional: 'TEAMS_ARRAY_ORDER',
      note: 'If the sums tie, teams[0] acts first. Not locked.',
    },
    damageFormula: {
      status: 'PENDING',
      rule: 'CORE-039',
      provisional: 'MAX_1_ATK_PLUS_BONUS_MINUS_DEF',
      note: 'Stand-in so a SAMPLE fight can end. Not a design value.',
    },
    maxHp: {
      status: 'PENDING',
      rule: 'CORE-039',
      provisional: 12,
      note: 'Stand-in max HP. Not a design value.',
    },
    healCap: {
      status: 'PENDING',
      rule: 'CORE-039',
      provisional: 'CLAMP_TO_STAND_IN_MAX',
      note: 'Regen cannot display above the stand-in max. Not a locked heal cap.',
    },
    regenTickTiming: {
      status: 'PENDING',
      rule: 'OPEN-02',
      provisional: 'START_OF_OWN_TURN',
      note: 'Regen heals at the start of that side\'s turn, then counts down.',
    },
    statusTiming: {
      status: 'PENDING',
      rule: 'OPEN-02',
      provisional: 'TICK_SIDE',
      note: 'Shield and Taunt expire when the opponent ends their turn. ATK buffs expire when the owner ends their turn.',
    },
    passives: {
      status: 'PROPOSED',
      provisional: 'SHEET_TEXT',
      note: 'Sheet passive text is rolled with the match seed. Not locked balance.',
    },
    deckDuplicateMax: {
      status: 'PENDING',
      rule: 'CORE-040',
      provisional: null,
      note: 'No duplicate cap until the Owner locks one.',
    },
    simultaneousDefeat: {
      status: 'PENDING',
      rule: 'CORE-004',
      provisional: 'ACTING_SIDE_WINS',
      note: 'If one resolution defeats both sides, the acting side wins. Not locked.',
    },
    gachaRates: { status: 'PENDING', rule: 'GA-11', note: 'No production drop rates.' },
    gachaPrice: { status: 'PENDING', rule: 'GA-11', note: 'G price is not locked. TEST pulls charge nothing.' },
    pityEpic: { value: 100, status: 'LOCKED', rule: 'GA-05' },
    pityTop: { value: 200, status: 'LOCKED', rule: 'GA-07' },
    companionTopPity: { value: null, status: 'LOCKED', rule: 'GA-10', note: 'Companion has no top-tier pity.' },
    pityReset: {
      status: 'PENDING',
      rule: 'GA-12',
      provisional: 'PER_BANNER_RESET_THAT_TIER_ON_HIT',
      note: 'TEST booth only: each banner has its own counters. Hitting Epic+ resets the Epic counter. Hitting top resets the top counter. Not locked.',
    },
    cabinStorage: { status: 'PENDING', rule: 'HOME-11', note: 'Cabin base storage is not locked.' },
  };
}

export function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed >>> 0;
  const text = String(seed ?? 'comedy');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rng) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

function cloneCard(card) {
  return {
    ...card,
    effect: card.effect ? { ...card.effect } : null,
  };
}

function emptyZones() {
  return { draw: [], hand: [], discard: [], void: [] };
}

function log(state, text) {
  state.log.push({ n: state.log.length + 1, text });
}

function otherSide(sideId) {
  return sideId === 'player' ? 'enemy' : 'player';
}

function living(state, sideId) {
  return state.units.filter((unit) => unit.sideId === sideId && !unit.ko);
}

function unitById(state, instanceId) {
  return state.units.find((unit) => unit.instanceId === instanceId) ?? null;
}

function handOf(state, sideId) {
  return state.zones[sideId].hand;
}

function teamSpd(members, config) {
  if (config.teamSpdAggregation.provisional !== 'SUM') return 0;
  return members.reduce((sum, member) => sum + (member.stats?.spd ?? 0), 0);
}

function makeUnit(member, sideId, maxHp) {
  return {
    instanceId: member.instanceId,
    avatarId: member.avatarId,
    assetId: member.assetId,
    name: member.name,
    sideId,
    factionId: member.factionId,
    factionName: member.factionName ?? factionName(member.factionId),
    role: member.role,
    rarity: member.rarity,
    stats: { atk: member.stats.atk, def: member.stats.def, spd: member.stats.spd },
    statsStatus: member.statsStatus ?? 'PROPOSED',
    active: member.active ? { ...member.active } : null,
    passive: member.passive ? { ...member.passive } : null,
    hp: maxHp,
    maxHp,
    hpStatus: 'PENDING',
    ko: false,
    statuses: [],
  };
}

function ongoing() {
  return { status: 'ongoing', winnerSideId: null, loserSideId: null };
}

function decided(winnerSideId, loserSideId) {
  return { status: 'decided', winnerSideId, loserSideId };
}

/**
 * @param {{ seed?: number|string, config?: object, teams: { sideId: string, members: object[] }[], decks: Record<string, object[]> }} input
 */
export function createMatch(input) {
  const config = input.config ?? defaultRuleConfig();
  const rng = mulberry32(hashSeed(input.seed ?? 1));
  const maxHp = config.maxHp.provisional;
  const teams = input.teams;
  if (!Array.isArray(teams) || teams.length !== 2) {
    throw new Error('createMatch needs two teams');
  }
  for (const team of teams) {
    if (!team.members || team.members.length !== config.partySize.value) {
      throw new Error(`Each team needs exactly ${config.partySize.value} avatars`);
    }
  }
  const units = [];
  const zones = {};
  const ap = {};
  for (const team of teams) {
    zones[team.sideId] = emptyZones();
    const deck = (input.decks?.[team.sideId] ?? []).map(cloneCard);
    if (deck.length !== config.deckSize.value) {
      throw new Error(`${team.sideId} deck must be ${config.deckSize.value} cards (got ${deck.length})`);
    }
    zones[team.sideId].draw = shuffle(deck, rng);
    ap[team.sideId] = 0;
    for (const member of team.members) {
      units.push(makeUnit(member, team.sideId, maxHp));
    }
  }
  const spd = teams.map((team) => ({
    sideId: team.sideId,
    spd: teamSpd(team.members, config),
  }));
  let first = spd[0].sideId;
  let tie = false;
  if (spd[1].spd > spd[0].spd) first = spd[1].sideId;
  else if (spd[1].spd === spd[0].spd) {
    tie = true;
    first = spd[0].sideId;
  }
  const state = {
    source: MOCK_SOURCE,
    productionReady: false,
    seed: hashSeed(input.seed ?? 1),
    config,
    rng,
    units,
    zones,
    ap,
    activeSideId: first,
    phase: 'ready',
    turnOpen: false,
    round: 1,
    log: [],
    outcome: ongoing(),
    lastError: null,
    mode: input.mode ?? 'tower',
    rewardsClaimed: false,
    firstSideId: first,
  };
  log(state, 'SAMPLE fight. Damage, HP, team SPD, and passive timing are not locked. See the rule badges.');
  log(state, `Stand-in HP ${maxHp} (CORE-039 PENDING). Formula: max(1, ATK + bonus − DEF).`);
  log(state, tie
    ? `Team SPD tied at ${spd[0].spd}. PENDING tie-break: the first team acts (${first}).`
    : `Team SPD ${spd.map((row) => `${row.sideId} ${row.spd}`).join(' vs ')}. ${first} acts first.`);
  for (const team of teams) drawToHandSize(state, team.sideId);
  log(state, 'Opening hands dealt to 5.');
  startTurn(state);
  return state;
}

function drawOne(state, sideId) {
  const zones = state.zones[sideId];
  if (zones.draw.length === 0) {
    if (zones.discard.length === 0) return null;
    zones.draw = shuffle(zones.discard, state.rng);
    zones.discard = [];
    log(state, `${label(sideId)} shuffles Discard into Draw. The Void stays where it is.`);
  }
  return zones.draw.pop() ?? null;
}

function drawToHandSize(state, sideId) {
  const hand = handOf(state, sideId);
  let guard = 0;
  while (hand.length < HAND_MAX && guard < 12) {
    guard += 1;
    const card = drawOne(state, sideId);
    if (!card) break;
    hand.push(card);
  }
}

function drawExtra(state, sideId, count) {
  const hand = handOf(state, sideId);
  for (let i = 0; i < count; i += 1) {
    const card = drawOne(state, sideId);
    if (!card) {
      log(state, 'The draw pile has nothing left to give.');
      return;
    }
    hand.push(card);
  }
  if (hand.length > HAND_MAX) {
    log(state, `${label(sideId)} hand is ${hand.length}. Extra draws may pass 5 until the free end-step.`);
  }
}

function label(sideId) {
  return sideId === 'player' ? 'You' : 'The echo';
}

function removeStatus(unit, id) {
  unit.statuses = unit.statuses.filter((status) => status.id !== id);
}

function addStatus(unit, status) {
  removeStatus(unit, status.id);
  unit.statuses.push({ ...status });
}

function tickRegen(state, sideId) {
  for (const unit of living(state, sideId)) {
    const regen = unit.statuses.find((status) => status.id === 'regen');
    if (!regen) continue;
    const before = unit.hp;
    const cap = unit.maxHp;
    unit.hp = Math.min(cap, unit.hp + regen.amount);
    regen.turns -= 1;
    log(state, `${unit.name} Regen +${regen.amount} (${before} → ${unit.hp}). ${Math.max(regen.turns, 0)} tick(s) left. OPEN-02 PENDING.`);
    if (regen.turns <= 0) removeStatus(unit, 'regen');
  }
}

function tickPassives(state, sideId) {
  if (state.config.passives?.status !== 'PROPOSED') return;
  for (const unit of living(state, sideId)) {
    const passive = unit.passive;
    if (!passive || passive.kind !== 'turnStart') continue;
    const quietName = passive.name || passive.sheetText || 'PROPOSED passive';
    if (state.rng() >= passive.chance) {
      log(state, `PROPOSED passive ${quietName} (${unit.name}) stays quiet.`);
      continue;
    }
    let targets = [unit];
    if (passive.scope === 'team') targets = living(state, sideId);
    if (passive.scope === 'randomAlly') {
      const allies = living(state, sideId);
      targets = [allies[Math.floor(state.rng() * allies.length)]];
    }
    for (const target of targets) {
      if (!target) continue;
      addStatus(target, {
        id: passive.buff,
        name: passive.buffName,
        amount: passive.amount,
        turns: 1,
        tickSide: otherSide(sideId),
        assetId: passive.assetId ?? 'ICO_STATUS_ATK',
        badge: 'PROPOSED',
      });
    }
    const passiveName = passive.name || passive.sheetText || 'PROPOSED passive';
  log(state, `PROPOSED passive ${passiveName}: ${passive.buffName} +${passive.amount}.`);
  }
}

export function startTurn(state) {
  if (state.outcome.status === 'decided') return state;
  if (state.turnOpen) return state;
  const sideId = state.activeSideId;
  tickRegen(state, sideId);
  tickPassives(state, sideId);
  drawToHandSize(state, sideId);
  state.ap[sideId] = state.config.baseAp.value;
  state.turnOpen = true;
  state.phase = sideId === 'player' ? 'playerTurn' : 'enemyTurn';
  log(state, `${label(sideId)} — turn start. AP reset to ${BASE_AP}. Hand ${handOf(state, sideId).length}.`);
  return state;
}

function tickDurations(state, endingSide) {
  for (const unit of state.units) {
    unit.statuses = unit.statuses.filter((status) => {
      if (status.id === 'regen') return true;
      if (status.tickSide !== endingSide) return true;
      return (status.turns - 1) > 0;
    }).map((status) => {
      if (status.id === 'regen' || status.tickSide !== endingSide) return status;
      return { ...status, turns: status.turns - 1 };
    });
  }
}

function finishTurn(state) {
  const ending = state.activeSideId;
  tickDurations(state, ending);
  const next = otherSide(ending);
  if (ending !== state.firstSideId) state.round += 1;
  state.activeSideId = next;
  state.turnOpen = false;
  state.phase = 'ready';
  startTurn(state);
  return state;
}

function discardSpecific(state, sideId, cardInstanceIds) {
  const hand = handOf(state, sideId);
  const dropping = [];
  for (const id of cardInstanceIds) {
    const index = hand.findIndex((card) => card.instanceId === id);
    if (index < 0) return { ok: false, reason: 'That card is not in hand.' };
    dropping.push(hand[index]);
  }
  const remain = hand.filter((card) => !cardInstanceIds.includes(card.instanceId));
  state.zones[sideId].hand = remain;
  state.zones[sideId].discard.push(...dropping);
  return { ok: true };
}

export function endTurn(state) {
  state.lastError = null;
  if (state.outcome.status === 'decided') {
    state.lastError = 'The fight is already over.';
    return state;
  }
  if (state.phase !== 'playerTurn' && state.phase !== 'enemyTurn') {
    state.lastError = 'End Turn is for an open turn.';
    return state;
  }
  const sideId = state.activeSideId;
  const excess = handOf(state, sideId).length - HAND_MAX;
  if (excess > 0) {
    if (sideId === 'enemy') {
      const hand = handOf(state, sideId);
      const ids = hand.slice(hand.length - excess).map((card) => card.instanceId);
      discardSpecific(state, sideId, ids);
      log(state, 'The echo dumps extra cards for free.');
    } else {
      state.phase = 'mandatoryDiscard';
      state.pendingDiscard = excess;
      log(state, `Hand has ${handOf(state, sideId).length} cards. Discard ${excess} for free (no AP).`);
      return state;
    }
  }
  log(state, `${label(sideId)} ends the turn with ${state.ap[sideId]} AP left.`);
  return finishTurn(state);
}

export function resolveEndOfRoundDiscard(state, cardInstanceIds) {
  state.lastError = null;
  if (state.phase !== 'mandatoryDiscard') {
    state.lastError = 'Nobody asked for a free discard.';
    return state;
  }
  const sideId = state.activeSideId;
  const excess = handOf(state, sideId).length - HAND_MAX;
  if (!Array.isArray(cardInstanceIds) || cardInstanceIds.length !== excess) {
    state.lastError = `Choose exactly ${excess} card${excess === 1 ? '' : 's'} to discard for free.`;
    return state;
  }
  const beforeAp = state.ap[sideId];
  const moved = discardSpecific(state, sideId, cardInstanceIds);
  if (!moved.ok) {
    state.lastError = moved.reason;
    return state;
  }
  state.ap[sideId] = beforeAp;
  state.pendingDiscard = 0;
  log(state, `Free discard ×${excess}. AP stays ${state.ap[sideId]}.`);
  return finishTurn(state);
}

function assess(state, action) {
  if (state.outcome.status === 'decided') return { ok: false, reason: 'The fight is already over.' };
  if (state.phase !== 'playerTurn' && state.phase !== 'enemyTurn') {
    return { ok: false, reason: 'You cannot play a card during the free discard step.' };
  }
  const sideId = state.activeSideId;
  const card = handOf(state, sideId).find((entry) => entry.instanceId === action?.cardInstanceId);
  if (!card) return { ok: false, reason: 'That card is not in hand.' };
  if (state.ap[sideId] < card.costAp) return { ok: false, reason: `Needs ${card.costAp} AP. You have ${state.ap[sideId]}.` };
  const actor = unitById(state, action?.actorAvatarId);
  if (!actor || actor.sideId !== sideId || actor.ko) {
    return { ok: false, reason: 'Pick a living avatar on your side.' };
  }
  if (card.factionRequirement && actor.factionId !== card.factionRequirement) {
    return { ok: false, reason: `FAC: needs a ${factionName(card.factionRequirement)} avatar.` };
  }
  let target = null;
  if (card.targetRule === 'Enemy') {
    target = unitById(state, action?.targets?.[0]);
    if (!target || target.sideId === sideId || target.ko) {
      return { ok: false, reason: 'Pick a living enemy.' };
    }
  }
  return { ok: true, card, actor, target, sideId };
}

function sumBuff(unit, id) {
  return unit.statuses.filter((status) => status.id === id).reduce((sum, status) => sum + status.amount, 0);
}

function checkOutcome(state, actingSide) {
  const playerDead = living(state, 'player').length === 0;
  const enemyDead = living(state, 'enemy').length === 0;
  if (!playerDead && !enemyDead) {
    state.outcome = ongoing();
    return;
  }
  if (playerDead && enemyDead) {
    const winner = actingSide;
    const loser = otherSide(actingSide);
    state.outcome = decided(winner, loser);
    log(state, 'Both sides fell together. PENDING simultaneous rule: the acting side wins.');
  } else if (enemyDead) {
    state.outcome = decided('player', 'enemy');
    log(state, 'Every echo is down. You win.');
  } else {
    state.outcome = decided('enemy', 'player');
    log(state, 'All four of yours are down. The echo wins.');
  }
  state.phase = 'outcome';
  state.turnOpen = false;
}

function castActive(state, actor) {
  const active = actor.active;
  if (!active) {
    log(state, `${actor.name} has no Active. The cue still spends the card.`);
    return;
  }
  if (active.kind === 'regenTeam') {
    for (const ally of living(state, actor.sideId)) {
      addStatus(ally, {
        id: 'regen',
        name: 'Regen',
        amount: active.amount,
        turns: active.turns,
        assetId: 'ICO_STATUS_REGEN',
        badge: active.status,
      });
    }
    log(state, `${actor.name} uses ${active.name} (${active.status}): allies Regen +${active.amount} for ${active.turns} turns.`);
    return;
  }
  if (active.kind === 'shieldTaunt') {
    addStatus(actor, {
      id: 'shield',
      name: 'Shield',
      amount: active.shield,
      turns: 1,
      tickSide: otherSide(actor.sideId),
      assetId: 'ICO_STATUS_SHIELD',
      badge: 'PROPOSED',
    });
    addStatus(actor, {
      id: 'taunt',
      name: 'Taunt',
      turns: active.tauntTurns,
      tickSide: otherSide(actor.sideId),
      assetId: 'ICO_STATUS_TAUNT',
      badge: 'PROPOSED',
    });
    log(state, `${actor.name} uses ${active.name} (PROPOSED): Shield +${active.shield}, Taunt.`);
    return;
  }
  if (active.kind === 'nextStrike') {
    addStatus(actor, {
      id: 'nextStrike',
      name: active.name,
      amount: active.bonus,
      turns: 1,
      tickSide: actor.sideId,
      assetId: 'ICO_STATUS_ATK',
      badge: 'PROPOSED',
    });
    log(state, `${actor.name} uses ${active.name} (PROPOSED): next strike +${active.bonus} this turn.`);
  }
}

function applyShield(state, actor, card) {
  const amount = card.effect?.shield ?? 0;
  const existing = actor.statuses.find((status) => status.id === 'shield');
  const total = (existing?.amount ?? 0) + amount;
  addStatus(actor, {
    id: 'shield',
    name: 'Shield',
    amount: total,
    turns: 1,
    tickSide: otherSide(actor.sideId),
    assetId: 'ICO_STATUS_SHIELD',
    badge: 'SAMPLE',
  });
  log(state, `${actor.name} plays ${card.name}: Shield +${amount} (now ${total}). SAMPLE.`);
}

function strike(state, actor, target, card) {
  let bonus = card.effect?.bonus ?? 0;
  const next = actor.statuses.find((status) => status.id === 'nextStrike');
  if (next) {
    bonus += next.amount;
    removeStatus(actor, 'nextStrike');
  }
  const passive = actor.passive;
  if (passive?.kind === 'onAttackBonus' && state.config.passives?.status === 'PROPOSED' && state.rng() < passive.chance) {
    bonus += passive.amount;
    log(state, `PROPOSED passive ${passive.name}: +${passive.amount} damage.`);
  }
  const atk = actor.stats.atk + sumBuff(actor, 'atkBuff') + bonus;
  const def = target.stats.def + sumBuff(target, 'defBuff');
  let raw = Math.max(1, atk - def);
  const shield = target.statuses.find((status) => status.id === 'shield');
  let absorbed = 0;
  if (shield && shield.amount > 0) {
    absorbed = Math.min(shield.amount, raw);
    shield.amount -= absorbed;
    raw -= absorbed;
    if (shield.amount <= 0) removeStatus(target, 'shield');
  }
  target.hp = Math.max(0, target.hp - raw);
  if (target.hp <= 0) {
    target.ko = true;
    target.statuses = [];
  }
  const hpText = target.ko ? `${target.name} is down.` : `${target.name} HP ${target.hp}/${target.maxHp} (provisional).`;
  log(state, `${actor.name} plays ${card.name} on ${target.name}: ${raw} damage${absorbed ? `, ${absorbed} shielded` : ''}. ${hpText}`);
  if (card.effect?.draw) drawExtra(state, actor.sideId, card.effect.draw);
}

function moveResolved(state, sideId, card) {
  const hand = handOf(state, sideId);
  const index = hand.findIndex((entry) => entry.instanceId === card.instanceId);
  if (index >= 0) hand.splice(index, 1);
  const zone = card.onResolveZone === 'Void' ? 'void' : 'discard';
  state.zones[sideId][zone].push(card);
  if (zone === 'void') log(state, `${card.name} goes to the Void.`);
}

/**
 * @param {object} state
 * @param {{ cardInstanceId: string, actorAvatarId: string, targets?: string[] }} action
 */
export function playAction(state, action) {
  const check = assess(state, action);
  if (!check.ok) {
    state.lastError = check.reason;
    return state;
  }
  state.lastError = null;
  const { card, actor, target, sideId } = check;
  state.ap[sideId] -= card.costAp;
  moveResolved(state, sideId, card);
  if (card.effect?.kind === 'active' || card.type === 'Skill') castActive(state, actor);
  else if (card.effect?.kind === 'shield') applyShield(state, actor, card);
  else if (card.effect?.kind === 'strike' && target) strike(state, actor, target, card);
  log(state, `AP ${state.ap[sideId]} left.`);
  checkOutcome(state, sideId);
  return state;
}

export function discardVoluntary(state, cardInstanceId) {
  state.lastError = null;
  if (state.phase !== 'playerTurn' && state.phase !== 'enemyTurn') {
    state.lastError = 'Voluntary discard is only on your open turn.';
    return state;
  }
  const sideId = state.activeSideId;
  const cost = state.config.voluntaryDiscardAp.value;
  if (state.ap[sideId] < cost) {
    state.lastError = `Tossing a card costs ${cost} AP.`;
    return state;
  }
  const hand = handOf(state, sideId);
  const index = hand.findIndex((card) => card.instanceId === cardInstanceId);
  if (index < 0) {
    state.lastError = 'That card is not in hand.';
    return state;
  }
  const [card] = hand.splice(index, 1);
  state.zones[sideId].discard.push(card);
  state.ap[sideId] -= cost;
  log(state, `Tossed ${card.name} for ${cost} AP. AP ${state.ap[sideId]}.`);
  return state;
}

export function getZones(state, sideId) {
  const zones = state.zones[sideId];
  if (!zones) return { draw: [], hand: [], discard: [], void: [] };
  return {
    draw: zones.draw.map(cloneCard),
    hand: zones.hand.map(cloneCard),
    discard: zones.discard.map(cloneCard),
    void: zones.void.map(cloneCard),
  };
}

export function getOutcome(state) {
  return { ...state.outcome };
}

function taunted(units) {
  return units.find((unit) => unit.statuses.some((status) => status.id === 'taunt')) ?? null;
}

/**
 * SAMPLE opponent driver. Calls the same playAction / endTurn. Not a design AI.
 * @param {object} state
 */
export function playEnemyTurn(state) {
  let guard = 0;
  while (state.phase === 'enemyTurn' && state.outcome.status === 'ongoing' && guard < 8) {
    guard += 1;
    const choice = chooseEnemyPlay(state);
    if (!choice) {
      endTurn(state);
      break;
    }
    const before = state.log.length;
    playAction(state, choice);
    if (state.lastError) {
      log(state, `Echo hesitates (${state.lastError}).`);
      if (state.log.length === before) {
        endTurn(state);
        break;
      }
      endTurn(state);
      break;
    }
  }
  if (state.phase === 'mandatoryDiscard') {
    // Enemy excess is auto-resolved inside endTurn. This is a safety hatch.
    endTurn(state);
  }
  return state;
}

function chooseEnemyPlay(state) {
  const actors = living(state, 'enemy');
  const foes = living(state, 'player');
  if (actors.length === 0 || foes.length === 0) return null;
  const hand = handOf(state, 'enemy').slice().sort((a, b) => a.costAp - b.costAp);
  for (const card of hand) {
    if (card.costAp > state.ap.enemy) continue;
    const legalActors = actors.filter((actor) => !card.factionRequirement || actor.factionId === card.factionRequirement);
    if (legalActors.length === 0) continue;
    if (card.type === 'Skill') {
      const actor = legalActors.find((unit) => unit.active) ?? legalActors[0];
      return { cardInstanceId: card.instanceId, actorAvatarId: actor.instanceId, targets: [] };
    }
    if (card.effect?.kind === 'shield') {
      const actor = legalActors.slice().sort((a, b) => a.hp - b.hp)[0];
      return { cardInstanceId: card.instanceId, actorAvatarId: actor.instanceId, targets: [] };
    }
    if (card.targetRule === 'Enemy') {
      const actor = legalActors.slice().sort((a, b) => b.stats.atk - a.stats.atk)[0];
      const target = taunted(foes) ?? foes.slice().sort((a, b) => a.hp - b.hp)[0];
      return { cardInstanceId: card.instanceId, actorAvatarId: actor.instanceId, targets: [target.instanceId] };
    }
  }
  return null;
}

export function createBannerState(banner) {
  return {
    bannerId: banner.bannerId,
    pool: banner.pool,
    name: banner.name,
    testConfig: true,
    weightStatus: 'TEST',
    weights: banner.weights.map((row) => ({ ...row })),
    pityEpic: 0,
    pityTop: 0,
    pityEpicMax: banner.pityEpic,
    pityTopMax: banner.pityTop,
    pulls: 0,
    pityReset: 'PENDING_GA-12',
  };
}

function rollRarity(rng, weights) {
  const total = weights.reduce((sum, row) => sum + row.weight, 0);
  let cursor = rng() * total;
  for (const row of weights) {
    cursor -= row.weight;
    if (cursor <= 0) return row.rarity;
  }
  return weights[weights.length - 1].rarity;
}

function epicPlus(pool, rarity) {
  if (pool === 'action') return rarity === 'Epic' || rarity === 'EX' || rarity === 'FAC';
  return rarity === 'Epic' || rarity === 'EX';
}

function isTop(pool, rarity) {
  if (pool === 'action') return rarity === 'EX' || rarity === 'FAC';
  if (pool === 'companion') return false;
  return rarity === 'EX';
}

/**
 * @param {ReturnType<typeof createBannerState>} bannerState
 * @param {{ seed?: number|string, count: number, catalog?: object }} request
 */
export function pull(bannerState, request) {
  const count = request.count;
  if (count !== 1 && count !== 10) {
    throw new Error('TEST pull count must be 1 or 10');
  }
  const rng = mulberry32(hashSeed(request.seed ?? Date.now()));
  const next = {
    ...bannerState,
    weights: bannerState.weights.map((row) => ({ ...row })),
  };
  const results = [];
  for (let i = 0; i < count; i += 1) {
    next.pityEpic += 1;
    if (next.pityTopMax != null) next.pityTop += 1;
    let rarity = rollRarity(rng, next.weights);
    let forced = null;
    if (next.pityTopMax != null && next.pityTop >= next.pityTopMax) {
      rarity = next.pool === 'action' ? (rng() < 0.5 ? 'EX' : 'FAC') : 'EX';
      forced = 'top';
    } else if (next.pityEpic >= next.pityEpicMax && !epicPlus(next.pool, rarity)) {
      rarity = 'Epic';
      forced = 'epic';
    }
    if (isTop(next.pool, rarity)) next.pityTop = 0;
    if (epicPlus(next.pool, rarity)) next.pityEpic = 0;
    results.push(materializePull(next, rarity, forced, rng, request.catalog));
    next.pulls += 1;
  }
  return {
    state: next,
    results,
    pityReset: 'PROVISIONAL_GA-12',
    chargedG: 0,
    priceStatus: 'PENDING',
  };
}

function materializePull(banner, rarity, forced, rng, catalog) {
  const base = {
    pool: banner.pool,
    rarity,
    forced,
    testConfig: true,
    testToken: false,
    avatarId: null,
    cardId: null,
    name: '',
    assetId: 'CARD_BACK_SAMPLE',
    note: 'TEST pull. Weights are not GA-11 rates.',
  };
  if (banner.pool === 'avatar') {
    if (rarity === 'Epic' && catalog?.justinIds?.length) {
      const id = catalog.justinIds[Math.floor(rng() * catalog.justinIds.length)];
      const avatar = catalog.avatarById(id);
      return {
        ...base,
        avatarId: id,
        name: avatar?.name ?? id,
        assetId: avatar?.assetId ?? id,
        note: 'Epic duplicate of a v0.5 sample avatar. TEST weight, not a live rate.',
      };
    }
    return {
      ...base,
      testToken: true,
      name: `TEST ${rarity} avatar token`,
      assetId: 'ICO_COMPANION',
      note: 'No published avatar of this rarity yet. Token only — not a new character.',
    };
  }
  if (banner.pool === 'action' && catalog?.actionCards) {
    const matches = catalog.actionCards.filter((card) => card.rarity === rarity);
    if (matches.length > 0) {
      const card = matches[Math.floor(rng() * matches.length)];
      return {
        ...base,
        cardId: card.cardId,
        name: card.name,
        assetId: 'CARD_BACK_SAMPLE',
        note: 'SAMPLE action card. TEST weight, not a live rate.',
      };
    }
    return {
      ...base,
      testToken: true,
      name: `TEST ${rarity} action token`,
      assetId: 'CARD_BACK_SAMPLE',
      note: 'No published action of this rarity in the SAMPLE list. Token only.',
    };
  }
  return {
    ...base,
    testToken: true,
    name: `TEST ${rarity} companion token`,
    assetId: 'ICO_COMPANION',
    note: 'Companion room is a placeholder. Token only. No relationship simulated.',
  };
}

export function serialize(input) {
  const profile = input?.profile?.avatars ? input.profile : input;
  return JSON.stringify({
    saveVersion: 1,
    source: 'mock-save',
    productionReady: false,
    profile,
  });
}

export function deserialize(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || data.saveVersion !== 1 || !data.profile) {
    throw new Error('This save is not a v1 web profile.');
  }
  return data.profile;
}

/**
 * Why a hand card cannot be played, or null if the player may start targeting.
 * Cancel never calls this. Disabled FAC cards return a reason and the UI must not call playAction.
 */
export function playBlockReason(state, card) {
  if (!state || state.phase !== 'playerTurn') return 'Wait for your turn.';
  if (state.ap.player < card.costAp) return `Needs ${card.costAp} AP.`;
  const allies = living(state, 'player');
  if (allies.length === 0) return 'No avatar left to perform it.';
  if (card.factionRequirement) {
    const match = allies.some((unit) => unit.factionId === card.factionRequirement);
    if (!match) return `FAC: no living ${factionName(card.factionRequirement)} avatar.`;
  }
  return null;
}
