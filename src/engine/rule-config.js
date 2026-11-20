/**
 * v0.5 rule config owned by the battle engine until stream B publishes src/config.
 * LOCKED numbers cannot be overridden. PENDING_OWNER entries cannot be promoted to LOCKED.
 * Placeholder numbers exist so the demo loop can be played. They are not approved balance.
 */

import { gameError } from './errors.js';

const DAMAGE_FORMULAS = new Set(['placeholder_atk_minus_def', 'placeholder_flat_atk']);
const SPD_AGGREGATIONS = new Set(['sum', 'average', 'max']);
const SIMULTANEOUS_POLICIES = new Set(['higher_team_spd_then_input_order', 'input_order']);
const HEAL_POLICIES = new Set(['clamp_to_max_hp', 'allow_overheal']);
const REGEN_STACKS = new Set(['refresh_ticks_keep_higher_amount', 'stack_separate']);
const AUTO_STEPS = new Set(['heal_regen', 'shield_taunt_if_lethal', 'highest_damage_lowest_hp']);

const TEMPLATE = {
  meta: {
    ruleset: 'v0.5',
    productionReady: false,
    readiness: 'incomplete',
  },
  partySize: { id: 'CORE-003', status: 'LOCKED', value: 4 },
  baseAp: { id: 'CORE-007', status: 'LOCKED', value: 5 },
  handSize: { id: 'CORE-010', status: 'LOCKED', value: 5 },
  openingHand: { id: 'CORE-010', status: 'LOCKED', value: 5 },
  deckSize: { id: 'CORE-009', status: 'LOCKED', value: 30 },
  voluntaryDiscardAp: { id: 'CORE-014', status: 'LOCKED', value: 1 },
  teamSpd: {
    id: 'CORE-038',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    aggregation: 'sum',
    tieBreak: 'seeded_rng',
    note: 'CORE-006 locks "higher team SPD starts, then sides alternate". CORE-038 leaves the aggregate and the tie-break unapproved. Placeholder: sum the four roster SPD values once at match start (defeated units are not removed from the total). A tie uses a dedicated seeded stream labelled spd-tie and does not advance the draw stream. Implemented aggregates: sum, average, max.',
  },
  simultaneousDeath: {
    id: 'CORE-004',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    policy: 'higher_team_spd_then_input_order',
    note: 'CORE-004 requires an explicit winner when both sides lose their last avatar in the same resolution. Placeholder policy: higher placeholder team SPD wins; if that is also tied, teams[0] wins. Alternate implemented policy: input_order (teams[0]). Neither policy is approved.',
  },
  damage: {
    id: 'CORE-039',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    formula: 'placeholder_atk_minus_def',
    minDamage: 1,
    note: 'No v0.5 source defines damage. placeholder_atk_minus_def is max(minDamage, effectiveATK - effectiveDEF) plus on-attack bonus damage from the attacker passive. effectiveATK includes ATK buffs and a next-attack bonus. Shield absorbs before HP. minDamage 1 is only there so a connecting attack can finish the demo loop; set it to 0 to allow zero-damage hits. placeholder_flat_atk ignores DEF and is also unapproved. This is not balance.',
  },
  hp: {
    id: 'CORE-039',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    formula: 'placeholder_base_plus_def',
    base: 10,
    perDef: 2,
    note: 'No v0.5 source defines HP. When an avatar does not bring maxHp, maxHp = 10 + DEF * 2. KO is HP 0. An avatar that supplies maxHp/hp uses those integers instead. Not an approved life-total rule.',
  },
  healCap: {
    id: 'OPEN-02',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    policy: 'clamp_to_max_hp',
    note: 'Heal cap is unapproved. Default placeholder clamps HP to maxHp. allow_overheal is an implemented alternate and is also unapproved.',
  },
  regenTickTiming: {
    id: 'OPEN-02',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    timing: 'start_of_affected_side_turn',
    note: 'Regen applied during a turn does not tick on that same turn. It ticks once at each later start of that side\'s turn. Ticks remaining then drop by one, and the status leaves at 0. Justina Saving Grace is card/avatar data: amount 3, ticks 2. Dead units are excluded. Only this timing is implemented; any other value is rejected rather than silently treated as this one.',
  },
  statusExpiry: {
    id: 'OPEN-02',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    timed: 'start_of_next_own_turn',
    thisTurn: 'end_of_turn',
    note: 'Timed statuses (Taunt, ATK/DEF buffs) expire at the start of the owner side\'s turn after durationTurns of that side\'s turns, using expireOnTurnIndex = appliedTurn + durationTurns * sideCount. A 1-turn Taunt applied on your turn therefore covers the enemy turn and drops as your next turn starts. Next-attack bonuses use thisTurn and drop when the active side ends the turn, or sooner once that next attack resolves.',
  },
  regenStack: {
    id: 'OPEN-02',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    policy: 'refresh_ticks_keep_higher_amount',
    note: 'A second regen on the same unit keeps the higher amount and refreshes ticksRemaining upward. stack_separate keeps both statuses. Neither policy is approved.',
  },
  deckDuplicateMax: {
    id: 'CORE-040',
    status: 'PENDING_OWNER',
    placeholder: false,
    value: null,
    note: 'null applies no duplicate cap. A positive integer caps copies of the same cardId. No cap number is approved, so the default invents none.',
  },
  buffStack: {
    id: 'OPEN-02',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    policy: 'sum_independent_durations',
    note: 'ATK and DEF buffs add together. Each buff keeps its own expiry.',
  },
  shield: {
    id: 'CORE-039',
    status: 'PENDING_OWNER',
    placeholder: true,
    label: 'PLACEHOLDER_NOT_APPROVED',
    policy: 'sum_pool_absorbs_before_hp',
    note: 'Shield amounts add into one pool and absorb damage before HP. The pool has no turn limit unless a future status says so. Taunt is a separate timed status. Not an approved mitigation rule.',
  },
  autoMode: {
    id: 'AUTO-MODE',
    status: 'LOCKED',
    enabled: true,
    note: 'AUTO battle mode is part of this ruleset. SYNC was dropped and is not implemented.',
  },
  autoPolicy: {
    id: 'AUTO-POLICY',
    status: 'PROPOSED',
    name: 'balanced',
    policies: {
      balanced: {
        allyLowHpRatio: 0.4,
        priorities: ['heal_regen', 'shield_taunt_if_lethal', 'highest_damage_lowest_hp'],
        spend: 'greedy',
        voluntaryDiscard: 'hand_locked_only',
      },
    },
    note: 'AUTO is locked. This preference table is proposed and editable. balanced heals or applies regen when an ally is under allyLowHpRatio of max HP, shields or taunts the tank when an enemy strike can KO, otherwise plays the highest estimated damage on the lowest-HP legal target. AP is spent greedily. A voluntary discard is used only for a hand-locked card.',
  },
};

const PENDING_KEYS = [
  'teamSpd',
  'simultaneousDeath',
  'damage',
  'hp',
  'healCap',
  'regenTickTiming',
  'statusExpiry',
  'regenStack',
  'deckDuplicateMax',
  'buffStack',
  'shield',
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeInto(base, override) {
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(base[key])) mergeInto(base[key], value);
    else base[key] = value;
  }
}

function assertConfig(config) {
  const locked = [
    ['partySize', 4],
    ['baseAp', 5],
    ['handSize', 5],
    ['openingHand', 5],
    ['deckSize', 30],
    ['voluntaryDiscardAp', 1],
  ];
  for (const [key, value] of locked) {
    if (config[key]?.status !== 'LOCKED' || config[key]?.value !== value) {
      throw gameError('LOCKED_RULE', `${key} is LOCKED at ${value}`);
    }
  }
  for (const key of PENDING_KEYS) {
    if (config[key]?.status !== 'PENDING_OWNER') {
      throw gameError('PENDING_LOCK', `${key} must stay PENDING_OWNER`);
    }
  }
  if (config.meta?.productionReady !== false) {
    throw gameError('READINESS_REJECTED', 'this engine build is incomplete');
  }
  if (!DAMAGE_FORMULAS.has(config.damage.formula)) throw gameError('UNKNOWN_FORMULA');
  if (!Number.isInteger(config.damage.minDamage) || config.damage.minDamage < 0) {
    throw gameError('INVALID_DAMAGE_CONFIG');
  }
  if (config.hp.formula !== 'placeholder_base_plus_def') throw gameError('UNKNOWN_HP_FORMULA');
  if (!Number.isInteger(config.hp.base) || config.hp.base < 0 || !Number.isInteger(config.hp.perDef) || config.hp.perDef < 0) {
    throw gameError('INVALID_HP_CONFIG');
  }
  if (!SPD_AGGREGATIONS.has(config.teamSpd.aggregation)) throw gameError('UNKNOWN_AGGREGATION');
  if (config.teamSpd.tieBreak !== 'seeded_rng') throw gameError('UNKNOWN_TIEBREAK');
  if (!SIMULTANEOUS_POLICIES.has(config.simultaneousDeath.policy)) throw gameError('UNKNOWN_SIMULTANEOUS');
  if (!HEAL_POLICIES.has(config.healCap.policy)) throw gameError('UNKNOWN_HEAL_CAP');
  if (config.regenTickTiming.timing !== 'start_of_affected_side_turn') throw gameError('UNKNOWN_REGEN_TIMING');
  if (config.statusExpiry.timed !== 'start_of_next_own_turn' || config.statusExpiry.thisTurn !== 'end_of_turn') {
    throw gameError('UNKNOWN_STATUS_EXPIRY');
  }
  if (!REGEN_STACKS.has(config.regenStack.policy)) throw gameError('UNKNOWN_REGEN_STACK');
  if (config.buffStack.policy !== 'sum_independent_durations') throw gameError('UNKNOWN_BUFF_STACK');
  if (config.shield.policy !== 'sum_pool_absorbs_before_hp') throw gameError('UNKNOWN_SHIELD_POLICY');
  if (config.autoMode?.status !== 'LOCKED' || config.autoMode?.enabled !== true) {
    throw gameError('LOCKED_RULE', 'AUTO mode is LOCKED on');
  }
  const auto = config.autoPolicy;
  if (auto?.status !== 'PROPOSED') throw gameError('PROPOSED_LOCK', 'autoPolicy must stay PROPOSED');
  if (!auto.policies || !auto.policies[auto.name]) throw gameError('UNKNOWN_AUTO_POLICY');
  for (const policy of Object.values(auto.policies)) {
    if (!Array.isArray(policy.priorities) || policy.priorities.length === 0) throw gameError('UNKNOWN_AUTO_POLICY');
    if (policy.priorities.some((step) => !AUTO_STEPS.has(step))) throw gameError('UNKNOWN_AUTO_POLICY');
    if (typeof policy.allyLowHpRatio !== 'number' || policy.allyLowHpRatio < 0 || policy.allyLowHpRatio > 1) {
      throw gameError('UNKNOWN_AUTO_POLICY');
    }
    if (policy.spend !== 'greedy') throw gameError('UNKNOWN_AUTO_POLICY');
    if (policy.voluntaryDiscard !== 'hand_locked_only') throw gameError('UNKNOWN_AUTO_POLICY');
  }
  const duplicateCap = config.deckDuplicateMax.value;
  if (duplicateCap !== null && !(Number.isInteger(duplicateCap) && duplicateCap >= 1)) {
    throw gameError('UNKNOWN_DUPLICATE_CAP');
  }
}

/** Fresh config. Safe to read and to pass into createMatch. */
export function defaultRuleConfig() {
  return JSON.parse(JSON.stringify(TEMPLATE));
}

/**
 * Merge an override onto the default. Locked values and PENDING status cannot be rewritten.
 * @param {object | null | undefined} override
 */
export function resolveRuleConfig(override) {
  const config = defaultRuleConfig();
  if (override === undefined || override === null) return config;
  if (!isPlainObject(override)) throw gameError('CONFIG_INVALID', 'rule config must be an object');
  mergeInto(config, override);
  assertConfig(config);
  return config;
}

export function pendingDecisionIds(config = defaultRuleConfig()) {
  return PENDING_KEYS.map((key) => config[key].id);
}
