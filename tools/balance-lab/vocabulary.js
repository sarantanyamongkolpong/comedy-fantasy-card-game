import { BASE_AP, CARD_ACTION_TYPES, HAND_SIZE, PARTY_SIZE } from '../../src/schema/constants.js';

/** Every laboratory artifact carries this label. It is not a game status. */
export const LAB_LABEL = 'EXPERIMENTAL';

export const DISCLAIMER =
  'EXPERIMENTAL: these results depend only on the parameters in this scenario. They are not game balance, not a recommendation, and not PRODUCTION_READY.';

/**
 * Question ids from docs/OPEN_DESIGN_DECISIONS.md that a battle scenario must answer.
 * Q-GACHA, Q-UPGRADE, Q-RARITY, and Q-SLOT-ANCHOR are out of scope for this laboratory.
 * Q-AP-LEFTOVER, Q-HAND-OWNER, and the party/hand/AP constants are engine facts, not parameters.
 */
export const PARAMETER_QUESTIONS = Object.freeze({
  teamSpd: 'Q-SPD-AGG',
  spdTieBreak: 'Q-SPD-TIE',
  hp: 'Q-HP',
  apCost: 'Q-AP-COST',
  damage: 'Q-DAMAGE',
  deck: 'Q-DECK-SIZE',
  draw: 'Q-DRAW-DISCARD',
  discard: 'Q-DRAW-DISCARD',
  actionLimit: 'Q-ACTION-LIMIT',
  skill: 'Q-SKILL',
  simultaneousDefeat: 'Q-SIMULTANEOUS',
  turnCap: 'Q-TURN-LIMIT',
  targeting: 'Q-TARGETING',
});

export const PARAMETER_KEYS = Object.freeze(Object.keys(PARAMETER_QUESTIONS));

export const ACTION_TYPES = Object.freeze([...CARD_ACTION_TYPES]);
export const STATS = Object.freeze(['pow', 'def', 'spd']);

export const FIXED_RULES = Object.freeze({
  partySize: PARTY_SIZE,
  handSize: HAND_SIZE,
  baseAp: BASE_AP,
  turns: 'alternating',
  start: 'highest team SPD, compared from the supplied teamSpd aggregation',
  actionTypes: ACTION_TYPES,
  outcome: 'engine evaluateOutcome using the supplied defeat predicate',
});

/** Keys a scenario must not set. The message explains why the value would not be honored. */
export const FORBIDDEN_PARAMETERS = Object.freeze({
  partySize: 'Party size is a fixed rule (4). The laboratory cannot override it.',
  handSize: 'Hand size is a fixed rule (5). The laboratory cannot override it.',
  baseAp: 'Base AP is a fixed rule (5). The laboratory cannot override it.',
  apLeftover:
    'Q-AP-LEFTOVER is fixed in the engine: a turn starts by assigning base AP, replacing leftovers. There is no injection point, so a scenario value would not change the battle.',
  gachaRate: 'Q-GACHA is outside this battle laboratory.',
  upgrade: 'Q-UPGRADE is outside this battle laboratory.',
  rarity: 'Q-RARITY is outside this battle laboratory.',
});

export const AGGREGATIONS = Object.freeze(['sum', 'max', 'min', 'mean']);
export const ROUNDINGS = Object.freeze(['none', 'floor', 'ceil']);
export const SIDE_PICKS = Object.freeze(['sideA', 'sideB', 'lowerSideId', 'higherSideId', 'seeded']);
export const SIMULTANEOUS_TIE_PICKS = Object.freeze(['sideA', 'sideB', 'lowerSideId', 'higherSideId', 'seeded']);
export const DEFEAT_CONDITIONS = Object.freeze(['everyAvatarHpZero', 'anyAvatarHpZero']);
export const ACTION_LIMIT_MODES = Object.freeze(['apOnly', 'maxPlays', 'maxByType', 'maxPlaysAndType']);
export const EMPTY_DECK = Object.freeze(['stopDrawing', 'reshuffleDiscard', 'loseOnEmptyDraw']);
export const HAND_FULL = Object.freeze(['skipCard', 'discardDrawn', 'loseOnOverflow']);
export const DRAW_TIMING = Object.freeze(['turnStart', 'never']);
export const DRAW_ORDER = Object.freeze(['listed', 'seededShuffle']);
export const OPENING_ORDER = Object.freeze(['sideAThenSideB', 'startingSideThenOther']);
export const DISCARD_DESTINATIONS = Object.freeze(['discardPile', 'removed', 'stayInPlay']);
export const DEF_KINDS = Object.freeze(['shield', 'mitigateNext', 'heal', 'noEffect']);
export const SKILL_KINDS = Object.freeze(['damage', 'heal', 'buffStat', 'noEffect']);
export const STACKS = Object.freeze(['add', 'replace']);
export const SHIELD_UNUSED = Object.freeze(['persist', 'expireAtStartOfOwnerNextTurn']);
export const ACTOR_SELECTORS = Object.freeze([
  'highestPowLiving',
  'highestSpdLiving',
  'lowestHpLiving',
  'firstLiving',
]);
export const ENEMY_SELECTORS = Object.freeze([
  'lowestHpEnemy',
  'highestHpEnemy',
  'firstLivingEnemy',
  'allLivingEnemies',
]);
export const ALLY_SELECTORS = Object.freeze([
  'lowestHpAlly',
  'highestHpAlly',
  'firstLivingAlly',
  'allLivingAllies',
]);
export const TIE_BREAKS = Object.freeze(['lowerAvatarId', 'higherAvatarId', 'partyOrder']);
export const STAT_READS = Object.freeze(['base', 'basePlusMarkerBonus']);
export const COMBAT_TERM_SIDES = Object.freeze(['actor', 'target']);
export const POOL_TERM_SIDES = Object.freeze(['self']);

/**
 * How the laboratory evaluates a supplied config. These are not game rules.
 * Reports copy this object so a result file states the evaluator it used.
 */
export const EVALUATOR_DEFINITIONS = Object.freeze({
  formulaClamp: 'minimum is applied first, then maximum when maximum is not null',
  zeroAmountConsumes: 'parameters.damage.incoming.zeroAmountConsumes decides whether a 0 amount clears mitigateNext',
  repeatSeed: 'repeatIndex uses seed + repeatIndex * repeatSeedStep',
  rng: 'mulberry32. Consumption order: seeded SPD tie-break (only when the team totals are equal), side A shuffle when order is seededShuffle, side B shuffle, reshuffles in time order, then a seeded simultaneous resolution if that rule runs',
  fingerprintExcludes: 'turnIndex, roundIndex, and the play log are excluded so a recurring position can be detected',
  dominanceDenominator:
    'wins divided by battles in that cell, including unresolved battles. Cells have equal weight. Mirror pairings are included. The observation is per seat because the starting seat can differ',
  maxSpendableAp:
    'largest AP from which an in-deck card can still be paid during one turn. Only skills whose grantsAp exceeds their own cost are helpers. The target card occupies a hand slot. The engine assigns base AP at turn start, so grants do not carry to the next turn',
  healSkipsDefeatedUnlessRevive:
    'ally heals and buffs include defeated avatars only when hp.revive is true. Damage selections never include them',
  drawLossSetsHpZero:
    'loseOnEmptyDraw and loseOnOverflow set that side\'s experimental HP to 0 so the supplied defeat predicate can run. This is not a second victory type',
  shieldExpiry:
    'expireAtStartOfOwnerNextTurn clears shield after the draw and before plays on the owner\'s later turns, so the shield is present during the opponent\'s intervening turn',
  multiTarget: 'every target selected at the start of an effect is resolved, then the outcome is evaluated once',
  actorStatRead: 'the actor selector reads parameters.targeting.actorStatRead and does not follow the damage formula\'s statRead on its own',
  teamSpdReadsBase: 'team SPD aggregation reads stats.spd only and ignores marker bonuses',
  playThenResolve:
    'the engine play spends AP and does not apply an effect. The laboratory then calls resolveEffect with the compiled damage or skill rule',
});

export const TOP_LEVEL_KEYS = Object.freeze([
  'label',
  'scenarioId',
  'notes',
  'seed',
  'repeats',
  'repeatSeedStep',
  'parameters',
  'sides',
  'policies',
  'policySweep',
]);
