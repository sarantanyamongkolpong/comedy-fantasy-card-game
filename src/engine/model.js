import { gameError } from './errors.js';
import { createRng, mixSeed, shuffleInPlace } from './rng.js';

export const FACTIONS = Object.freeze([
  Object.freeze({ factionId: 'FAC_AEG', name: 'Aegis Dominion', role: 'Tank' }),
  Object.freeze({ factionId: 'FAC_PHA', name: 'Phantom Blades', role: 'DPS' }),
  Object.freeze({ factionId: 'FAC_CEL', name: 'Celestial Nexus', role: 'Magic' }),
  Object.freeze({ factionId: 'FAC_SAN', name: 'Sanctuary Order', role: 'Support' }),
]);

export const ACTION_TYPES = Object.freeze(['ATK', 'DEF', 'Skill']);
export const ACTION_RARITIES = Object.freeze(['N', 'R', 'Epic', 'EX', 'FAC']);
export const TARGET_RULES = Object.freeze(['Self', 'Ally', 'All_Allies', 'Enemy', 'All_Enemies', 'Card', 'Pile']);
const EFFECT_OPS = new Set(['damage', 'shield', 'taunt', 'buff', 'regen', 'draw', 'next_attack', 'trigger_active', 'retrieve']);
const PASSIVE_OPS = new Set([...EFFECT_OPS, 'bonus_damage']);

export function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getState(state) {
  return cloneData(state);
}

export function writeState(target, source) {
  for (const key of Object.keys(target)) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) delete target[key];
  }
  for (const [key, value] of Object.entries(source)) target[key] = value;
  return target;
}

export function withRng(state, fn) {
  const rng = createRng(state.rngState);
  const value = fn(rng);
  state.rngState = rng.getState();
  return value;
}

/**
 * @param {unknown} value
 */
export function normalizeFaction(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') throw gameError('UNKNOWN_FACTION');
  const found = FACTIONS.find((faction) => faction.factionId === value || faction.name === value);
  if (!found) throw gameError('UNKNOWN_FACTION', `Unknown faction "${value}"`);
  return found;
}

export function isLiving(unit) {
  return Boolean(unit?.alive) && unit.hp > 0;
}

export function living(units) {
  return units.filter((unit) => isLiving(unit));
}

export function opponentId(state, sideId) {
  const other = state.sideOrder.find((id) => id !== sideId);
  if (!other) throw gameError('UNKNOWN_SIDE');
  return other;
}

export function aggregateTeamSpd(units, aggregation) {
  const values = units.map((unit) => unit.stats.spd);
  if (aggregation === 'sum') return values.reduce((total, value) => total + value, 0);
  if (aggregation === 'average') return values.reduce((total, value) => total + value, 0) / values.length;
  if (aggregation === 'max') return Math.max(...values);
  throw gameError('UNKNOWN_AGGREGATION');
}

export function effectiveStat(unit, stat, includeNextAttack = false) {
  let total = unit.stats[stat];
  for (const status of unit.statuses) {
    if (status.kind === 'buff' && status.stat === stat) total += status.amount;
    if (includeNextAttack && stat === 'atk' && status.kind === 'next_attack') total += status.amount;
  }
  return total;
}

/**
 * @param {object} state
 * @param {object} side
 * @param {{ nextInt: (count: number) => number }} rng
 */
export function recycleDiscard(state, side, rng) {
  if (side.zones.draw.length > 0 || side.zones.discard.length === 0) return false;
  const recycled = side.zones.discard;
  side.zones.discard = [];
  shuffleInPlace(recycled, rng);
  side.zones.draw = recycled;
  state.log.push({
    type: 'shuffle_discard',
    sideId: side.sideId,
    count: side.zones.draw.length,
    voidCount: side.zones.void.length,
  });
  return true;
}

/**
 * @param {object} state
 * @param {object} side
 * @param {{ nextInt: (count: number) => number }} rng
 */
export function pullCard(state, side, rng) {
  if (side.zones.draw.length === 0) recycleDiscard(state, side, rng);
  if (side.zones.draw.length === 0) return null;
  return side.zones.draw.shift();
}

export function permitMatches(card, permit) {
  if (!permit || typeof permit !== 'object') return false;
  const keys = ['cardIds', 'types', 'instanceIds'].filter((key) => Array.isArray(permit[key]));
  if (keys.length === 0) return false;
  if (permit.cardIds && !permit.cardIds.includes(card.cardId)) return false;
  if (permit.types && !permit.types.includes(card.type)) return false;
  if (permit.instanceIds && !permit.instanceIds.includes(card.instanceId)) return false;
  return true;
}

function integerIn(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function assertEffect(effect, { allowTrigger, allowBonus }) {
  if (!effect || typeof effect.op !== 'string') throw gameError('INVALID_EFFECT');
  if (effect.op === 'bonus_damage') {
    if (!allowBonus || !Number.isInteger(effect.amount)) throw gameError('INVALID_EFFECT');
    return;
  }
  if (!EFFECT_OPS.has(effect.op)) throw gameError('INVALID_EFFECT');
  if (effect.op === 'trigger_active' && !allowTrigger) throw gameError('INVALID_EFFECT');
  if (effect.op === 'damage') {
    if (effect.mode === 'flat' && !integerIn(effect.amount, 0, 9999)) throw gameError('INVALID_EFFECT');
    if (effect.mode !== 'flat' && effect.mode !== 'formula') throw gameError('INVALID_EFFECT');
  }
  if (effect.op === 'shield' && !integerIn(effect.amount, 0, 9999)) throw gameError('INVALID_EFFECT');
  if ((effect.op === 'taunt' || effect.op === 'buff') && !integerIn(effect.durationTurns, 1, 99)) {
    throw gameError('INVALID_EFFECT');
  }
  if (effect.op === 'buff' && effect.stat !== 'atk' && effect.stat !== 'def') throw gameError('INVALID_EFFECT');
  if (effect.op === 'buff' && !Number.isInteger(effect.amount)) throw gameError('INVALID_EFFECT');
  if (effect.op === 'regen' && (!integerIn(effect.amount, 0, 9999) || !integerIn(effect.ticks, 1, 99))) {
    throw gameError('INVALID_EFFECT');
  }
  if (effect.op === 'draw' && !integerIn(effect.count, 1, 60)) throw gameError('INVALID_EFFECT');
  if (effect.op === 'next_attack' && !Number.isInteger(effect.amount)) throw gameError('INVALID_EFFECT');
  if (effect.op === 'retrieve') {
    if (effect.pile !== 'discard' && effect.pile !== 'void') throw gameError('RETRIEVE_PILE');
    if (!['hand', 'draw', 'discard'].includes(effect.destination)) throw gameError('RETRIEVE_DESTINATION');
    if (effect.destination === effect.pile) throw gameError('RETRIEVE_DESTINATION');
    const permit = effect.permit;
    const lists = ['cardIds', 'types', 'instanceIds'];
    const explicit = permit && lists.some((key) => Array.isArray(permit[key]) && permit[key].length > 0);
    if (!explicit) throw gameError('RETRIEVE_PERMIT');
    if (effect.count !== undefined && !integerIn(effect.count, 1, 30)) throw gameError('RETRIEVE_COUNT');
  }
}

function assertEffectList(effects, options) {
  if (!Array.isArray(effects)) throw gameError('INVALID_EFFECT');
  let retrieves = 0;
  for (const effect of effects) {
    assertEffect(effect, options);
    if (effect.op === 'retrieve') retrieves += 1;
  }
  if (retrieves > 1) throw gameError('RETRIEVE_LIMIT');
}

/**
 * @param {object} raw
 * @param {string} instanceId
 */
export function normalizeCard(raw, instanceId) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw gameError('INVALID_CARD');
  if (raw.cardKind === 'avatar_card' || raw.cardKind === 'avatar') throw gameError('AVATAR_NOT_ACTION');
  const type = raw.type ?? raw.actionType ?? raw.Type;
  if (typeof type !== 'string') throw gameError('UNKNOWN_CARD_TYPE');
  if (!ACTION_TYPES.includes(type)) throw gameError('UNKNOWN_CARD_TYPE', `Unsupported action type ${type}`);
  const cardId = raw.cardId ?? raw.Action_ID;
  if (typeof cardId !== 'string' || cardId.length === 0) throw gameError('INVALID_CARD');
  const costs = [raw.costAp, raw.apCost, raw.Cost_AP].filter((value) => value !== undefined && value !== null);
  if (costs.length === 0) throw gameError('COST_UNASSIGNED', `${cardId} has no AP cost`);
  if (new Set(costs).size > 1) throw gameError('CONFLICTING_COST', cardId);
  const costAp = costs[0];
  if (!integerIn(costAp, 0, 5)) throw gameError('COST_OUT_OF_RANGE', `${cardId} cost ${costAp}`);
  const rarity = raw.rarity ?? raw.Rarity ?? null;
  if (rarity !== null && !ACTION_RARITIES.includes(rarity)) throw gameError('UNKNOWN_RARITY');
  const faction = normalizeFaction(raw.factionRequirement ?? raw.Faction_Requirement ?? null);
  const factionOverride = Boolean(raw.factionOverride ?? raw.Faction_Override);
  if (rarity === 'FAC' && !faction && !factionOverride) throw gameError('FACTION_REQUIRED', cardId);
  const targetRule = raw.targetRule ?? raw.Target_Rule;
  if (!TARGET_RULES.includes(targetRule)) throw gameError('UNKNOWN_TARGET_RULE');
  const effects = raw.effects ?? raw.Effect_Spec ?? [];
  assertEffectList(effects, { allowTrigger: true, allowBonus: false });
  const zoneRaw = raw.onResolveZone ?? raw.On_Resolve_Zone ?? 'Discard';
  const onResolveZone = String(zoneRaw).toLowerCase() === 'void' ? 'void' : String(zoneRaw).toLowerCase() === 'discard' ? 'discard' : null;
  if (!onResolveZone) throw gameError('UNKNOWN_ZONE', `${cardId} zone ${zoneRaw}`);
  const skillTargetCount = raw.skillTargetCount ?? 1;
  if (!integerIn(skillTargetCount, 1, 4)) throw gameError('INVALID_CARD');
  return {
    instanceId,
    cardId,
    name: typeof raw.name === 'string' ? raw.name : (typeof raw.Name === 'string' ? raw.Name : cardId),
    type,
    rarity,
    factionRequirement: faction ? faction.name : null,
    factionOverride,
    costAp,
    targetRule,
    effects: cloneData(effects),
    onResolveZone,
    zoneRecovery: raw.zoneRecovery ?? raw.Zone_Recovery ?? null,
    skillTargetCount,
    versionAndStatus: raw.versionAndStatus ?? raw.Version_And_Status ?? null,
  };
}

function skillBlock(raw, label) {
  if (raw === null || raw === undefined) return null;
  if (!raw || typeof raw !== 'object') throw gameError('INVALID_SKILL', label);
  const effects = Array.isArray(raw.effects) ? raw.effects : [];
  return {
    name: typeof raw.name === 'string' ? raw.name : label,
    status: raw.status ?? 'PROPOSED',
    chance: raw.chance ?? null,
    trigger: raw.trigger ?? null,
    target: raw.target ?? null,
    includeSelf: raw.includeSelf !== false,
    effects: cloneData(effects),
  };
}

/**
 * @param {object} raw
 * @param {object} config
 * @param {string} sideId
 */
export function normalizeAvatar(raw, config, sideId) {
  if (!raw || typeof raw.avatarId !== 'string' || raw.avatarId.length === 0) throw gameError('INVALID_AVATAR');
  const faction = normalizeFaction(raw.faction ?? raw.factionId ?? raw.factionName);
  if (!faction) throw gameError('UNKNOWN_FACTION', raw.avatarId);
  if (raw.role !== undefined && raw.role !== faction.role) throw gameError('FACTION_ROLE', raw.avatarId);
  const stats = raw.stats ?? {};
  const legacyPow = stats.pow ?? stats.legacy?.pow ?? raw.legacy?.pow;
  let atk = stats.atk;
  if (atk === undefined || atk === null) atk = legacyPow;
  if (!integerIn(atk, 0, 9999) || !integerIn(stats.def, 0, 9999) || !integerIn(stats.spd, 0, 9999)) {
    throw gameError('INVALID_STATS', raw.avatarId);
  }
  const maxHp = Number.isInteger(raw.maxHp) ? raw.maxHp : config.hp.base + stats.def * config.hp.perDef;
  let hp = Number.isInteger(raw.hp) ? raw.hp : maxHp;
  if (!integerIn(maxHp, 1, 99999) || !integerIn(hp, 0, 99999)) throw gameError('INVALID_STATS', raw.avatarId);
  if (config.healCap.policy === 'clamp_to_max_hp' && hp > maxHp) hp = maxHp;
  const active = skillBlock(raw.active, 'active');
  const passive = skillBlock(raw.passive, 'passive');
  if (active) assertEffectList(active.effects, { allowTrigger: false, allowBonus: false });
  if (passive) {
    if (passive.trigger !== 'turn_start' && passive.trigger !== 'on_attack') throw gameError('INVALID_SKILL');
    if (typeof passive.chance !== 'number' || passive.chance < 0 || passive.chance > 1) throw gameError('INVALID_SKILL');
    assertEffectList(passive.effects, { allowTrigger: false, allowBonus: true });
    for (const effect of passive.effects) {
      if (!PASSIVE_OPS.has(effect.op) || effect.op === 'trigger_active') throw gameError('INVALID_SKILL');
    }
  }
  return {
    unitId: `${sideId}:${raw.avatarId}`,
    avatarId: raw.avatarId,
    sideId,
    designRef: raw.designRef ?? null,
    name: raw.name ?? raw.nameEn ?? raw.avatarId,
    faction: faction.name,
    factionId: faction.factionId,
    role: faction.role,
    rarity: raw.rarity ?? null,
    gender: raw.gender ?? null,
    statStatus: raw.statStatus ?? null,
    assetRef: raw.assetRef ?? null,
    stats: { atk, def: stats.def, spd: stats.spd },
    legacy: Number.isInteger(legacyPow) ? { pow: legacyPow } : null,
    hp,
    maxHp,
    shield: Number.isInteger(raw.shield) ? raw.shield : 0,
    alive: hp > 0,
    statuses: [],
    active,
    passive,
    hpStatus: 'PENDING_OWNER',
  };
}

export function chooseStarter(state) {
  const [leftId, rightId] = state.sideOrder;
  const left = state.sides[leftId].teamSpd;
  const right = state.sides[rightId].teamSpd;
  if (left > right) return { startingSideId: leftId, tieBreakUsed: false };
  if (right > left) return { startingSideId: rightId, tieBreakUsed: false };
  const rng = createRng(mixSeed(state.seed, 'spd-tie'));
  return {
    startingSideId: rng.next() < 0.5 ? leftId : rightId,
    tieBreakUsed: true,
  };
}

function pickSimultaneousWinner(state) {
  const [leftId, rightId] = state.sideOrder;
  const policy = state.config.simultaneousDeath.policy;
  if (policy === 'input_order') return leftId;
  if (policy === 'higher_team_spd_then_input_order') {
    const left = state.sides[leftId].teamSpd;
    const right = state.sides[rightId].teamSpd;
    if (left > right) return leftId;
    if (right > left) return rightId;
    return leftId;
  }
  throw gameError('UNKNOWN_SIMULTANEOUS');
}

function decide(state, winnerSideId, loserSideId, reason) {
  if (state.rewards) return state.outcome;
  const rewards = {
    emissionId: `${state.matchId}:rewards`,
    emitted: true,
    timesEmitted: 1,
    matchId: state.matchId,
    winnerSideId,
    loserSideId,
    reason,
    payloadStatus: 'PENDING_OWNER',
    payload: null,
  };
  state.rewards = rewards;
  state.outcome = {
    status: 'decided',
    winnerSideId,
    loserSideId,
    verdict: { [winnerSideId]: 'victory', [loserSideId]: 'defeat' },
    reason,
    rewards,
  };
  state.phase = 'decided';
  state.log.push({ type: 'outcome', status: 'decided', winnerSideId, loserSideId, reason });
  state.log.push({ type: 'rewards', emissionId: rewards.emissionId, timesEmitted: 1, winnerSideId, loserSideId, reason });
  return state.outcome;
}

export function checkOutcome(state) {
  if (state.outcome.status === 'decided') return state.outcome;
  const [leftId, rightId] = state.sideOrder;
  const leftDead = state.sides[leftId].avatars.every((unit) => !isLiving(unit));
  const rightDead = state.sides[rightId].avatars.every((unit) => !isLiving(unit));
  if (!leftDead && !rightDead) return state.outcome;
  if (leftDead && rightDead) {
    const winner = pickSimultaneousWinner(state);
    return decide(state, winner, winner === leftId ? rightId : leftId, 'simultaneous_death');
  }
  if (leftDead) return decide(state, rightId, leftId, 'all_avatars_defeated');
  return decide(state, leftId, rightId, 'all_avatars_defeated');
}

export function ongoingOutcome() {
  return {
    status: 'ongoing',
    winnerSideId: null,
    loserSideId: null,
    verdict: null,
    reason: null,
    rewards: null,
  };
}

export function locateInstance(state, instanceId) {
  for (const sideId of state.sideOrder) {
    const side = state.sides[sideId];
    for (const zoneName of ['draw', 'hand', 'discard', 'void']) {
      const index = side.zones[zoneName].findIndex((card) => card.instanceId === instanceId);
      if (index >= 0) return { side, zoneName, index, card: side.zones[zoneName][index] };
    }
  }
  return null;
}

export function findUnit(side, avatarId) {
  return side.avatars.find((unit) => unit.avatarId === avatarId) ?? null;
}

export function scheduleExpiry(state, durationTurns) {
  return state.turnIndex + durationTurns * state.sideOrder.length;
}

export function pushStatus(state, unit, status) {
  state.nextStatusId += 1;
  unit.statuses.push({ statusId: `status-${state.nextStatusId}`, ...status });
}

export function applyHeal(unit, amount, config) {
  if (!isLiving(unit) || amount <= 0) return 0;
  if (config.healCap.policy === 'clamp_to_max_hp') {
    const healed = Math.max(0, Math.min(amount, unit.maxHp - unit.hp));
    unit.hp += healed;
    return healed;
  }
  if (config.healCap.policy === 'allow_overheal') {
    unit.hp += amount;
    return amount;
  }
  throw gameError('UNKNOWN_HEAL_CAP');
}

export function applyDamage(unit, amount) {
  const incoming = Math.max(0, amount);
  const absorbed = Math.min(unit.shield, incoming);
  unit.shield -= absorbed;
  const dealt = incoming - absorbed;
  unit.hp = Math.max(0, unit.hp - dealt);
  let defeated = false;
  if (unit.hp === 0 && unit.alive) {
    unit.alive = false;
    unit.shield = 0;
    unit.statuses = [];
    defeated = true;
  }
  return { absorbed, dealt, defeated };
}

function activeDamageRule(config) {
  const damage = config.damage;
  if (!damage.preset) {
    return { formula: damage.formula, minDamage: damage.minDamage, floorPct: null, preset: null };
  }
  const preset = damage.presets?.[damage.preset];
  if (!preset) throw gameError('UNKNOWN_FORMULA', `Unknown damage preset ${damage.preset}`);
  return {
    formula: preset.formula,
    minDamage: preset.minDamage,
    floorPct: preset.floorPct ?? null,
    preset: damage.preset,
  };
}

function percentFloor(atk, floorPct) {
  const scaled = Math.round(floorPct * 100);
  return Math.ceil((atk * scaled) / 100);
}

export function formulaDamage(attacker, defender, config, bonus) {
  const rule = activeDamageRule(config);
  const atk = effectiveStat(attacker, 'atk', true);
  const def = effectiveStat(defender, 'def', false);
  let raw;
  if (rule.formula === 'placeholder_atk_minus_def') raw = atk - def;
  else if (rule.formula === 'placeholder_flat_atk') raw = atk;
  else throw gameError('UNKNOWN_FORMULA');
  let amount = Math.max(rule.minDamage, raw);
  if (typeof rule.floorPct === 'number') amount = Math.max(amount, percentFloor(atk, rule.floorPct));
  return {
    amount: amount + bonus,
    atk,
    def,
    formula: rule.formula,
    preset: rule.preset,
    placeholder: true,
  };
}
