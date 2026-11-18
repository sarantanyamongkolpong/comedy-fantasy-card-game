import { HAND_SIZE, PARTY_SIZE } from '../../src/schema/constants.js';
import { ConfigError } from './errors.js';
import {
  ACTION_LIMIT_MODES,
  ACTION_TYPES,
  ACTOR_SELECTORS,
  AGGREGATIONS,
  ALLY_SELECTORS,
  COMBAT_TERM_SIDES,
  DEFEAT_CONDITIONS,
  DEF_KINDS,
  DISCARD_DESTINATIONS,
  DRAW_ORDER,
  DRAW_TIMING,
  EMPTY_DECK,
  ENEMY_SELECTORS,
  FORBIDDEN_PARAMETERS,
  HAND_FULL,
  LAB_LABEL,
  OPENING_ORDER,
  PARAMETER_KEYS,
  PARAMETER_QUESTIONS,
  POOL_TERM_SIDES,
  ROUNDINGS,
  SHIELD_UNUSED,
  SIDE_PICKS,
  SIMULTANEOUS_TIE_PICKS,
  SKILL_KINDS,
  STACKS,
  STAT_READS,
  STATS,
  TIE_BREAKS,
  TOP_LEVEL_KEYS,
} from './vocabulary.js';

const UINT32_MAX = 0xffffffff;

/**
 * @param {unknown} config
 * @returns {{ ok: boolean, errors: { path: string, message: string, questionId: string | null }[] }}
 */
export function validateConfig(config) {
  const errors = [];
  if (!isObject(config)) {
    return { ok: false, errors: [{ path: '$', message: 'scenario must be an object', questionId: null }] };
  }
  rejectUnknown(config, TOP_LEVEL_KEYS, '$', errors, null);
  requireLabel(config.label, 'label', errors);
  if (typeof config.scenarioId !== 'string' || !/^EXPERIMENTAL_[A-Za-z0-9_]+$/.test(config.scenarioId)) {
    errors.push({
      path: 'scenarioId',
      message: 'must match EXPERIMENTAL_[A-Za-z0-9_]+',
      questionId: null,
    });
  }
  if (typeof config.notes !== 'string') {
    errors.push({ path: 'notes', message: 'must be a string (empty is allowed)', questionId: null });
  }
  const seedOk = requireInteger(config.seed, 'seed', errors, null, 0, UINT32_MAX);
  const repeatsOk = requireInteger(config.repeats, 'repeats', errors, null, 1, null);
  const stepOk = requireInteger(config.repeatSeedStep, 'repeatSeedStep', errors, null, 0, null);
  if (seedOk && repeatsOk && stepOk) {
    const last = config.seed + (config.repeats - 1) * config.repeatSeedStep;
    if (!Number.isSafeInteger(last) || last > UINT32_MAX) {
      errors.push({
        path: 'repeatSeedStep',
        message: 'seed + (repeats - 1) * repeatSeedStep must stay within 0 through 4294967295',
        questionId: null,
      });
    }
  }
  validateParameters(config.parameters, errors);
  validateSides(config.sides, errors);
  validatePolicies(config.policies, errors);
  validatePolicySweep(config.policySweep, errors);
  return { ok: errors.length === 0, errors };
}

/**
 * @param {unknown} config
 */
export function assertConfig(config) {
  const result = validateConfig(config);
  if (!result.ok) throw new ConfigError(result.errors);
  return config;
}

/**
 * @param {unknown} parameters
 * @param {object[]} errors
 */
function validateParameters(parameters, errors) {
  if (!isObject(parameters)) {
    for (const key of PARAMETER_KEYS) {
      errors.push({
        path: `parameters.${key}`,
        message: 'missing; every undecided battle parameter must be supplied',
        questionId: PARAMETER_QUESTIONS[key],
      });
    }
    return;
  }
  rejectUnknown(parameters, [...PARAMETER_KEYS, ...Object.keys(FORBIDDEN_PARAMETERS)], 'parameters', errors, null);
  for (const [key, message] of Object.entries(FORBIDDEN_PARAMETERS)) {
    if (key in parameters) {
      errors.push({ path: `parameters.${key}`, message, questionId: null });
    }
  }
  for (const key of PARAMETER_KEYS) {
    if (!(key in parameters)) {
      errors.push({
        path: `parameters.${key}`,
        message: 'missing; this undecided parameter has no laboratory default',
        questionId: PARAMETER_QUESTIONS[key],
      });
    } else if (!isObject(parameters[key])) {
      errors.push({
        path: `parameters.${key}`,
        message: 'must be an object',
        questionId: PARAMETER_QUESTIONS[key],
      });
    }
  }
  if (isObject(parameters.teamSpd)) validateTeamSpd(parameters.teamSpd, errors);
  if (isObject(parameters.spdTieBreak)) validateTie(parameters.spdTieBreak, 'parameters.spdTieBreak', errors, 'Q-SPD-TIE');
  if (isObject(parameters.hp)) validateHp(parameters.hp, errors);
  if (isObject(parameters.apCost)) validateApCost(parameters.apCost, errors);
  if (isObject(parameters.damage)) validateDamage(parameters.damage, errors);
  if (isObject(parameters.deck)) validateDeck(parameters.deck, parameters.apCost, errors);
  if (isObject(parameters.draw)) validateDraw(parameters.draw, parameters.deck, errors);
  if (isObject(parameters.discard)) validateDiscard(parameters.discard, errors);
  if (isObject(parameters.actionLimit)) validateActionLimit(parameters.actionLimit, errors);
  if (isObject(parameters.skill)) validateSkill(parameters.skill, errors);
  if (isObject(parameters.simultaneousDefeat)) validateSimultaneous(parameters.simultaneousDefeat, errors);
  if (isObject(parameters.turnCap)) validateTurnCap(parameters.turnCap, errors);
  if (isObject(parameters.targeting) && isObject(parameters.damage) && isObject(parameters.skill)) {
    validateTargeting(parameters.targeting, parameters.damage, parameters.skill, errors);
  } else if (isObject(parameters.targeting)) {
    errors.push({
      path: 'parameters.targeting',
      message: 'targeting is checked together with damage.defCard and skill.kind',
      questionId: 'Q-TARGETING',
    });
  }
}

function validateTeamSpd(value, errors) {
  const path = 'parameters.teamSpd';
  const questionId = 'Q-SPD-AGG';
  rejectUnknown(value, ['aggregation', 'rounding'], path, errors, questionId);
  requireEnum(value.aggregation, AGGREGATIONS, `${path}.aggregation`, errors, questionId);
  requireEnum(value.rounding, ROUNDINGS, `${path}.rounding`, errors, questionId);
  if (value.aggregation !== 'mean' && value.rounding !== 'none') {
    errors.push({
      path: `${path}.rounding`,
      message: 'floor and ceil are only meaningful for aggregation "mean"; set rounding to "none"',
      questionId,
    });
  }
}

function validateTie(value, path, errors, questionId) {
  rejectUnknown(value, ['method'], path, errors, questionId);
  requireEnum(value.method, SIDE_PICKS, `${path}.method`, errors, questionId);
}

function validateHp(value, errors) {
  const path = 'parameters.hp';
  const questionId = 'Q-HP';
  rejectUnknown(
    value,
    ['scope', 'pool', 'defeatWhen', 'floorAtZero', 'healCanExceedStarting', 'revive'],
    path,
    errors,
    questionId,
  );
  if (value.scope !== 'perAvatar') {
    errors.push({
      path: `${path}.scope`,
      message: 'only "perAvatar" is implemented; other scopes are rejected rather than coerced',
      questionId,
    });
  }
  validateFormula(value.pool, `${path}.pool`, errors, questionId, POOL_TERM_SIDES);
  requireEnum(value.defeatWhen, DEFEAT_CONDITIONS, `${path}.defeatWhen`, errors, questionId);
  requireBoolean(value.floorAtZero, `${path}.floorAtZero`, errors, questionId);
  requireBoolean(value.healCanExceedStarting, `${path}.healCanExceedStarting`, errors, questionId);
  requireBoolean(value.revive, `${path}.revive`, errors, questionId);
}

function validateApCost(value, errors) {
  const path = 'parameters.apCost';
  const questionId = 'Q-AP-COST';
  rejectUnknown(value, ['byActionType', 'avatarModifier', 'perCard'], path, errors, questionId);
  if (value.avatarModifier !== 'none') {
    errors.push({
      path: `${path}.avatarModifier`,
      message:
        'only "none" is implemented. An avatar-modified cost was not ignored; set "none" or extend the laboratory',
      questionId,
    });
  }
  if (!isObject(value.byActionType)) {
    errors.push({ path: `${path}.byActionType`, message: 'must be an object with ATK, DEF, and Skill', questionId });
  } else {
    rejectUnknown(value.byActionType, ACTION_TYPES, `${path}.byActionType`, errors, questionId);
    for (const actionType of ACTION_TYPES) {
      if (!(actionType in value.byActionType)) {
        errors.push({
          path: `${path}.byActionType.${actionType}`,
          message: 'missing cost; there is no default AP cost',
          questionId,
        });
      } else {
        requireInteger(value.byActionType[actionType], `${path}.byActionType.${actionType}`, errors, questionId, 0, null);
      }
    }
  }
  if (!Array.isArray(value.perCard)) {
    errors.push({
      path: `${path}.perCard`,
      message: 'must be an array (empty if every card uses byActionType)',
      questionId,
    });
    return;
  }
  const seen = new Set();
  value.perCard.forEach((entry, index) => {
    const entryPath = `${path}.perCard[${index}]`;
    if (!isObject(entry)) {
      errors.push({ path: entryPath, message: 'must be an object', questionId });
      return;
    }
    rejectUnknown(entry, ['actionType', 'index', 'cost'], entryPath, errors, questionId);
    requireEnum(entry.actionType, ACTION_TYPES, `${entryPath}.actionType`, errors, questionId);
    requireInteger(entry.index, `${entryPath}.index`, errors, questionId, 0, null);
    requireInteger(entry.cost, `${entryPath}.cost`, errors, questionId, 0, null);
    if (typeof entry.actionType === 'string' && Number.isInteger(entry.index)) {
      const key = `${entry.actionType}:${entry.index}`;
      if (seen.has(key)) {
        errors.push({ path: entryPath, message: `duplicate override for ${key}`, questionId });
      }
      seen.add(key);
    }
  });
}

function validateDamage(value, errors) {
  const path = 'parameters.damage';
  const questionId = 'Q-DAMAGE';
  rejectUnknown(value, ['atk', 'defCard', 'incoming'], path, errors, questionId);
  validateFormula(value.atk, `${path}.atk`, errors, questionId, COMBAT_TERM_SIDES);
  if (!isObject(value.defCard)) {
    errors.push({ path: `${path}.defCard`, message: 'must be an object', questionId });
  } else {
    rejectUnknown(value.defCard, ['kind', 'amount', 'stacks'], `${path}.defCard`, errors, questionId);
    requireEnum(value.defCard.kind, DEF_KINDS, `${path}.defCard.kind`, errors, questionId);
    if (value.defCard.kind === 'noEffect') {
      requireNull(value.defCard.amount, `${path}.defCard.amount`, errors, questionId);
      requireNull(value.defCard.stacks, `${path}.defCard.stacks`, errors, questionId);
    } else if (value.defCard.kind === 'heal') {
      validateFormula(value.defCard.amount, `${path}.defCard.amount`, errors, questionId, COMBAT_TERM_SIDES);
      requireNull(value.defCard.stacks, `${path}.defCard.stacks`, errors, questionId);
    } else if (value.defCard.kind === 'shield' || value.defCard.kind === 'mitigateNext') {
      validateFormula(value.defCard.amount, `${path}.defCard.amount`, errors, questionId, COMBAT_TERM_SIDES);
      requireEnum(value.defCard.stacks, STACKS, `${path}.defCard.stacks`, errors, questionId);
    }
  }
  if (!isObject(value.incoming)) {
    errors.push({ path: `${path}.incoming`, message: 'must be an object', questionId });
    return;
  }
  rejectUnknown(value.incoming, ['order', 'shieldUnused', 'zeroAmountConsumes'], `${path}.incoming`, errors, questionId);
  requireBoolean(value.incoming.zeroAmountConsumes, `${path}.incoming.zeroAmountConsumes`, errors, questionId);
  const kind = value.defCard?.kind;
  const order = value.incoming.order;
  if (!Array.isArray(order)) {
    errors.push({ path: `${path}.incoming.order`, message: 'must be an array', questionId });
  } else if (kind === 'shield' && !sameList(order, ['shield'])) {
    errors.push({
      path: `${path}.incoming.order`,
      message: 'shield defCard requires order ["shield"]',
      questionId,
    });
  } else if (kind === 'mitigateNext' && !sameList(order, ['mitigateNext'])) {
    errors.push({
      path: `${path}.incoming.order`,
      message: 'mitigateNext defCard requires order ["mitigateNext"]',
      questionId,
    });
  } else if ((kind === 'heal' || kind === 'noEffect') && order.length !== 0) {
    errors.push({
      path: `${path}.incoming.order`,
      message: 'heal and noEffect defCards require order []',
      questionId,
    });
  }
  if (kind === 'shield') {
    requireEnum(value.incoming.shieldUnused, SHIELD_UNUSED, `${path}.incoming.shieldUnused`, errors, questionId);
  } else if (value.incoming.shieldUnused !== null) {
    errors.push({
      path: `${path}.incoming.shieldUnused`,
      message: 'must be null unless defCard.kind is "shield"',
      questionId,
    });
  }
  if ((kind === 'heal' || kind === 'noEffect') && value.incoming.zeroAmountConsumes !== false) {
    errors.push({
      path: `${path}.incoming.zeroAmountConsumes`,
      message: 'must be false when no incoming mitigation is defined',
      questionId,
    });
  }
}

function validateDeck(value, apCost, errors) {
  const path = 'parameters.deck';
  const questionId = 'Q-DECK-SIZE';
  rejectUnknown(
    value,
    ['size', 'scope', 'includeAvatarCards', 'avatarCardCount', 'avatarCardPosition', 'composition'],
    path,
    errors,
    questionId,
  );
  requireInteger(value.size, `${path}.size`, errors, questionId, 0, null);
  if (value.scope !== 'perSide') {
    errors.push({
      path: `${path}.scope`,
      message:
        'only "perSide" is implemented. The engine attaches one hand per side (Q-HAND-OWNER). Other scopes are rejected rather than coerced',
      questionId,
    });
  }
  requireBoolean(value.includeAvatarCards, `${path}.includeAvatarCards`, errors, questionId);
  requireInteger(value.avatarCardCount, `${path}.avatarCardCount`, errors, questionId, 0, PARTY_SIZE);
  if (value.includeAvatarCards === false && value.avatarCardCount !== 0) {
    errors.push({
      path: `${path}.avatarCardCount`,
      message: 'must be 0 when includeAvatarCards is false',
      questionId,
    });
  }
  if (value.includeAvatarCards === true && (!Number.isInteger(value.avatarCardCount) || value.avatarCardCount < 1)) {
    errors.push({
      path: `${path}.avatarCardCount`,
      message: 'must be at least 1 when includeAvatarCards is true',
      questionId,
    });
  }
  if (value.includeAvatarCards === true && value.avatarCardPosition !== 'front' && value.avatarCardPosition !== 'back') {
    errors.push({
      path: `${path}.avatarCardPosition`,
      message: 'must be "front" or "back" when avatar cards are in the deck',
      questionId,
    });
  }
  if (value.includeAvatarCards === false && value.avatarCardPosition !== null) {
    errors.push({
      path: `${path}.avatarCardPosition`,
      message: 'must be null when includeAvatarCards is false',
      questionId,
    });
  }
  const counts = new Map();
  if (!Array.isArray(value.composition)) {
    errors.push({
      path: `${path}.composition`,
      message: 'must list ATK, DEF, and Skill exactly once each',
      questionId,
    });
    return;
  }
  if (value.composition.length !== ACTION_TYPES.length) {
    errors.push({
      path: `${path}.composition`,
      message: 'must list ATK, DEF, and Skill exactly once each',
      questionId,
    });
  }
  const seen = new Set();
  value.composition.forEach((entry, index) => {
    const entryPath = `${path}.composition[${index}]`;
    if (!isObject(entry)) {
      errors.push({ path: entryPath, message: 'must be an object', questionId });
      return;
    }
    rejectUnknown(entry, ['actionType', 'count'], entryPath, errors, questionId);
    requireEnum(entry.actionType, ACTION_TYPES, `${entryPath}.actionType`, errors, questionId);
    requireInteger(entry.count, `${entryPath}.count`, errors, questionId, 0, null);
    if (typeof entry.actionType === 'string') {
      if (seen.has(entry.actionType)) {
        errors.push({ path: entryPath, message: `duplicate ${entry.actionType}`, questionId });
      }
      seen.add(entry.actionType);
      if (Number.isInteger(entry.count)) counts.set(entry.actionType, entry.count);
    }
  });
  for (const actionType of ACTION_TYPES) {
    if (!seen.has(actionType)) {
      errors.push({
        path: `${path}.composition`,
        message: `missing ${actionType}; a count of 0 must be written explicitly`,
        questionId,
      });
    }
  }
  if (Number.isInteger(value.size) && counts.size === ACTION_TYPES.length && Number.isInteger(value.avatarCardCount)) {
    const sum = [...counts.values()].reduce((total, count) => total + count, 0) + value.avatarCardCount;
    if (sum !== value.size) {
      errors.push({
        path: `${path}.size`,
        message: `size is ${value.size} but composition plus avatar cards sum to ${sum}`,
        questionId,
      });
    }
  }
  if (isObject(apCost) && Array.isArray(apCost.perCard)) {
    apCost.perCard.forEach((entry, index) => {
      if (!isObject(entry) || !Number.isInteger(entry.index)) return;
      const count = counts.get(entry.actionType);
      if (count === undefined) return;
      if (entry.index >= count) {
        errors.push({
          path: `parameters.apCost.perCard[${index}].index`,
          message: `index ${entry.index} is outside ${entry.actionType} count ${count}`,
          questionId: 'Q-AP-COST',
        });
      }
    });
  }
}

function validateDraw(value, deck, errors) {
  const path = 'parameters.draw';
  const questionId = 'Q-DRAW-DISCARD';
  rejectUnknown(
    value,
    [
      'openingCount',
      'openingIncludesFirstTurn',
      'openingOrder',
      'eachTurnCount',
      'timing',
      'emptyDeck',
      'handFull',
      'order',
    ],
    path,
    errors,
    questionId,
  );
  requireInteger(value.openingCount, `${path}.openingCount`, errors, questionId, 0, null);
  requireBoolean(value.openingIncludesFirstTurn, `${path}.openingIncludesFirstTurn`, errors, questionId);
  requireEnum(value.openingOrder, OPENING_ORDER, `${path}.openingOrder`, errors, questionId);
  requireInteger(value.eachTurnCount, `${path}.eachTurnCount`, errors, questionId, 0, null);
  requireEnum(value.timing, DRAW_TIMING, `${path}.timing`, errors, questionId);
  requireEnum(value.emptyDeck, EMPTY_DECK, `${path}.emptyDeck`, errors, questionId);
  requireEnum(value.handFull, HAND_FULL, `${path}.handFull`, errors, questionId);
  requireEnum(value.order, DRAW_ORDER, `${path}.order`, errors, questionId);
  if (value.eachTurnCount === 0 && value.timing !== 'never') {
    errors.push({
      path: `${path}.timing`,
      message: 'must be "never" when eachTurnCount is 0',
      questionId,
    });
  }
  if (Number.isInteger(value.eachTurnCount) && value.eachTurnCount > 0 && value.timing !== 'turnStart') {
    errors.push({
      path: `${path}.timing`,
      message: 'must be "turnStart" when eachTurnCount is greater than 0',
      questionId,
    });
  }
  if (value.eachTurnCount === 0 && value.openingIncludesFirstTurn !== true) {
    errors.push({
      path: `${path}.openingIncludesFirstTurn`,
      message: 'must be true when there is no per-turn draw',
      questionId,
    });
  }
  if (isObject(deck) && Number.isInteger(deck.size) && Number.isInteger(value.openingCount) && value.openingCount > deck.size) {
    if (value.emptyDeck !== 'reshuffleDiscard' && value.handFull !== 'discardDrawn') {
      errors.push({
        path: `${path}.openingCount`,
        message: 'openingCount exceeds the deck and this empty-deck policy cannot recycle cards',
        questionId,
      });
    }
  }
  if (Number.isInteger(value.openingCount) && value.openingCount > HAND_SIZE && value.handFull === 'skipCard') {
    errors.push({
      path: `${path}.openingCount`,
      message: `openingCount exceeds the hand size of ${HAND_SIZE} and handFull "skipCard" would leave the extra cards undrawn without saying so in a recycle rule; use a handFull policy that states the overflow or lower openingCount`,
      questionId,
    });
  }
}

function validateDiscard(value, errors) {
  const path = 'parameters.discard';
  const questionId = 'Q-DRAW-DISCARD';
  rejectUnknown(value, ['playedCardsGoTo'], path, errors, questionId);
  requireEnum(value.playedCardsGoTo, DISCARD_DESTINATIONS, `${path}.playedCardsGoTo`, errors, questionId);
}

function validateActionLimit(value, errors) {
  const path = 'parameters.actionLimit';
  const questionId = 'Q-ACTION-LIMIT';
  rejectUnknown(value, ['mode', 'maxPlays', 'maxByType'], path, errors, questionId);
  requireEnum(value.mode, ACTION_LIMIT_MODES, `${path}.mode`, errors, questionId);
  if (value.maxPlays !== null) requireInteger(value.maxPlays, `${path}.maxPlays`, errors, questionId, 0, null);
  const byType = value.maxByType;
  if (!isObject(byType)) {
    errors.push({ path: `${path}.maxByType`, message: 'must be an object with ATK, DEF, and Skill', questionId });
  } else {
    rejectUnknown(byType, ACTION_TYPES, `${path}.maxByType`, errors, questionId);
    for (const actionType of ACTION_TYPES) {
      if (!(actionType in byType)) {
        errors.push({
          path: `${path}.maxByType.${actionType}`,
          message: 'missing; use null when this type has no extra cap',
          questionId,
        });
      } else if (byType[actionType] !== null) {
        requireInteger(byType[actionType], `${path}.maxByType.${actionType}`, errors, questionId, 0, null);
      }
    }
  }
  const playsActive = value.mode === 'maxPlays' || value.mode === 'maxPlaysAndType';
  const typeActive = value.mode === 'maxByType' || value.mode === 'maxPlaysAndType';
  if (value.mode === 'apOnly') {
    if (value.maxPlays !== null) {
      errors.push({ path: `${path}.maxPlays`, message: 'must be null when mode is "apOnly"', questionId });
    }
    if (isObject(byType) && ACTION_TYPES.some((type) => byType[type] !== null)) {
      errors.push({ path: `${path}.maxByType`, message: 'every type must be null when mode is "apOnly"', questionId });
    }
  }
  if (playsActive && value.maxPlays === null) {
    errors.push({ path: `${path}.maxPlays`, message: `mode "${value.mode}" requires an integer maxPlays`, questionId });
  }
  if (!playsActive && value.mode === 'maxByType' && value.maxPlays !== null) {
    errors.push({ path: `${path}.maxPlays`, message: 'must be null when mode is "maxByType"', questionId });
  }
  if (typeActive && isObject(byType) && ACTION_TYPES.some((type) => byType[type] === null || byType[type] === undefined)) {
    errors.push({
      path: `${path}.maxByType`,
      message: `mode "${value.mode}" requires an integer for ATK, DEF, and Skill`,
      questionId,
    });
  }
  if (!typeActive && value.mode === 'maxPlays' && isObject(byType) && ACTION_TYPES.some((type) => byType[type] !== null)) {
    errors.push({ path: `${path}.maxByType`, message: 'every type must be null when mode is "maxPlays"', questionId });
  }
}

function validateSkill(value, errors) {
  const path = 'parameters.skill';
  const questionId = 'Q-SKILL';
  rejectUnknown(value, ['kind', 'amount', 'grantsAp', 'stat', 'duration', 'stacks'], path, errors, questionId);
  requireEnum(value.kind, SKILL_KINDS, `${path}.kind`, errors, questionId);
  requireInteger(value.grantsAp, `${path}.grantsAp`, errors, questionId, 0, null);
  if (value.kind === 'noEffect') {
    requireNull(value.amount, `${path}.amount`, errors, questionId);
    requireNull(value.stat, `${path}.stat`, errors, questionId);
    requireNull(value.duration, `${path}.duration`, errors, questionId);
    requireNull(value.stacks, `${path}.stacks`, errors, questionId);
  } else if (value.kind === 'damage' || value.kind === 'heal') {
    validateFormula(value.amount, `${path}.amount`, errors, questionId, COMBAT_TERM_SIDES);
    requireNull(value.stat, `${path}.stat`, errors, questionId);
    requireNull(value.duration, `${path}.duration`, errors, questionId);
    requireNull(value.stacks, `${path}.stacks`, errors, questionId);
  } else if (value.kind === 'buffStat') {
    validateFormula(value.amount, `${path}.amount`, errors, questionId, COMBAT_TERM_SIDES);
    requireEnum(value.stat, STATS, `${path}.stat`, errors, questionId);
    if (value.duration !== 'battle') {
      errors.push({
        path: `${path}.duration`,
        message: 'buffStat currently requires duration "battle"; other durations are rejected rather than ignored',
        questionId,
      });
    }
    requireEnum(value.stacks, STACKS, `${path}.stacks`, errors, questionId);
  }
}

function validateSimultaneous(value, errors) {
  const path = 'parameters.simultaneousDefeat';
  const questionId = 'Q-SIMULTANEOUS';
  rejectUnknown(value, ['method', 'whenTeamSpdTied'], path, errors, questionId);
  requireEnum(value.method, [...SIDE_PICKS, 'higherTeamSpd'], `${path}.method`, errors, questionId);
  if (value.method === 'higherTeamSpd') {
    requireEnum(value.whenTeamSpdTied, SIMULTANEOUS_TIE_PICKS, `${path}.whenTeamSpdTied`, errors, questionId);
  } else if (value.whenTeamSpdTied !== null) {
    errors.push({
      path: `${path}.whenTeamSpdTied`,
      message: 'must be null unless method is "higherTeamSpd"',
      questionId,
    });
  }
}

function validateTurnCap(value, errors) {
  const path = 'parameters.turnCap';
  const questionId = 'Q-TURN-LIMIT';
  rejectUnknown(value, ['maxTurns', 'atCap'], path, errors, questionId);
  requireInteger(value.maxTurns, `${path}.maxTurns`, errors, questionId, 1, null);
  if (value.atCap !== 'unresolved') {
    errors.push({
      path: `${path}.atCap`,
      message: 'must be "unresolved". The laboratory reports the cap and does not turn it into a winner',
      questionId,
    });
  }
}

function validateTargeting(value, damage, skill, errors) {
  const path = 'parameters.targeting';
  const questionId = 'Q-TARGETING';
  rejectUnknown(value, ['actor', 'actorStatRead', 'tieBreak', 'atk', 'def', 'skill'], path, errors, questionId);
  requireEnum(value.actor, ACTOR_SELECTORS, `${path}.actor`, errors, questionId);
  requireEnum(value.actorStatRead, STAT_READS, `${path}.actorStatRead`, errors, questionId);
  requireEnum(value.tieBreak, TIE_BREAKS, `${path}.tieBreak`, errors, questionId);
  requireEnum(value.atk, ENEMY_SELECTORS, `${path}.atk`, errors, questionId);
  const defKind = damage.defCard?.kind;
  if (defKind === 'noEffect') {
    requireNull(value.def, `${path}.def`, errors, questionId);
  } else if (defKind === 'heal' || defKind === 'shield' || defKind === 'mitigateNext') {
    requireEnum(value.def, ALLY_SELECTORS, `${path}.def`, errors, questionId);
  }
  if (skill.kind === 'noEffect') {
    requireNull(value.skill, `${path}.skill`, errors, questionId);
  } else if (skill.kind === 'damage') {
    requireEnum(value.skill, ENEMY_SELECTORS, `${path}.skill`, errors, questionId);
  } else if (skill.kind === 'heal' || skill.kind === 'buffStat') {
    requireEnum(value.skill, ALLY_SELECTORS, `${path}.skill`, errors, questionId);
  }
}

function validateSides(sides, errors) {
  if (!isObject(sides)) {
    errors.push({ path: 'sides', message: 'must be an object with A and B', questionId: null });
    return;
  }
  rejectUnknown(sides, ['A', 'B'], 'sides', errors, null);
  validateSide(sides.A, 'sides.A', errors);
  validateSide(sides.B, 'sides.B', errors);
  if (isObject(sides.A) && isObject(sides.B) && sides.A.sideId && sides.A.sideId === sides.B.sideId) {
    errors.push({ path: 'sides', message: 'side ids must be different', questionId: null });
  }
  const ids = [];
  for (const key of ['A', 'B']) {
    const members = sides[key]?.members;
    if (!Array.isArray(members)) continue;
    for (const member of members) {
      if (isObject(member) && typeof member.avatarId === 'string') ids.push(member.avatarId);
    }
  }
  const dupes = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (dupes.length > 0) {
    errors.push({ path: 'sides', message: `duplicate avatarId ${dupes[0]}`, questionId: null });
  }
}

function validateSide(side, path, errors) {
  if (!isObject(side)) {
    errors.push({ path, message: 'must be an object', questionId: null });
    return;
  }
  rejectUnknown(side, ['sideId', 'members'], path, errors, null);
  if (typeof side.sideId !== 'string' || !/^LAB_[A-Z0-9_]+$/.test(side.sideId)) {
    errors.push({
      path: `${path}.sideId`,
      message: 'must match LAB_[A-Z0-9_]+ so a scenario cannot reuse a production id',
      questionId: null,
    });
  }
  if (!Array.isArray(side.members) || side.members.length !== PARTY_SIZE) {
    errors.push({
      path: `${path}.members`,
      message: `must list exactly ${PARTY_SIZE} avatars`,
      questionId: null,
    });
    return;
  }
  side.members.forEach((member, index) => validateMember(member, `${path}.members[${index}]`, errors));
}

function validateMember(member, path, errors) {
  if (!isObject(member)) {
    errors.push({ path, message: 'must be an object', questionId: null });
    return;
  }
  rejectUnknown(member, ['avatarId', 'pow', 'def', 'spd'], path, errors, null);
  if (typeof member.avatarId !== 'string' || !/^LAB_[A-Z0-9_]+$/.test(member.avatarId)) {
    errors.push({
      path: `${path}.avatarId`,
      message: 'must match LAB_[A-Z0-9_]+. Production avatar ids are not accepted here',
      questionId: null,
    });
  }
  requireInteger(member.pow, `${path}.pow`, errors, null, 0, null);
  requireInteger(member.def, `${path}.def`, errors, null, 0, null);
  requireInteger(member.spd, `${path}.spd`, errors, null, 0, null);
}

function validatePolicies(policies, errors) {
  if (!isObject(policies)) {
    errors.push({ path: 'policies', message: 'must be an object with sideA and sideB', questionId: null });
    return;
  }
  rejectUnknown(policies, ['sideA', 'sideB'], 'policies', errors, null);
  validatePolicy(policies.sideA, 'policies.sideA', errors);
  validatePolicy(policies.sideB, 'policies.sideB', errors);
}

function validatePolicySweep(sweep, errors) {
  if (sweep === null) return;
  if (!Array.isArray(sweep) || sweep.length === 0) {
    errors.push({
      path: 'policySweep',
      message: 'must be null or a non-empty array of EXPERIMENTAL policies',
      questionId: null,
    });
    return;
  }
  const ids = new Set();
  sweep.forEach((policy, index) => {
    validatePolicy(policy, `policySweep[${index}]`, errors);
    if (isObject(policy) && typeof policy.id === 'string') {
      if (ids.has(policy.id)) {
        errors.push({ path: `policySweep[${index}].id`, message: `duplicate policy id ${policy.id}`, questionId: null });
      }
      ids.add(policy.id);
    }
  });
}

function validatePolicy(policy, path, errors) {
  if (!isObject(policy)) {
    errors.push({ path, message: 'must be an object', questionId: null });
    return;
  }
  rejectUnknown(policy, ['id', 'label', 'priority'], path, errors, null);
  if (typeof policy.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(policy.id)) {
    errors.push({ path: `${path}.id`, message: 'must be a policy id such as always-ATK', questionId: null });
  }
  if (policy.label !== LAB_LABEL) {
    errors.push({ path: `${path}.label`, message: 'must be "EXPERIMENTAL"', questionId: null });
  }
  if (!Array.isArray(policy.priority) || policy.priority.length === 0) {
    errors.push({ path: `${path}.priority`, message: 'must be a non-empty list of action types', questionId: null });
    return;
  }
  const seen = new Set();
  policy.priority.forEach((actionType, index) => {
    if (!ACTION_TYPES.includes(actionType)) {
      errors.push({
        path: `${path}.priority[${index}]`,
        message: 'must be ATK, DEF, or Skill',
        questionId: null,
      });
    } else if (seen.has(actionType)) {
      errors.push({ path: `${path}.priority[${index}]`, message: `duplicate ${actionType}`, questionId: null });
    }
    seen.add(actionType);
  });
}

/**
 * @param {unknown} formula
 * @param {string} path
 * @param {object[]} errors
 * @param {string} questionId
 * @param {readonly string[]} allowedSides
 */
function validateFormula(formula, path, errors, questionId, allowedSides) {
  if (!isObject(formula)) {
    errors.push({ path, message: 'must be a linear formula object', questionId });
    return;
  }
  rejectUnknown(formula, ['kind', 'constant', 'terms', 'minimum', 'maximum', 'statRead'], path, errors, questionId);
  if (formula.kind !== 'linear') {
    errors.push({
      path: `${path}.kind`,
      message:
        'must be "linear". Named presets are rejected so every coefficient is written in the scenario',
      questionId,
    });
  }
  requireInteger(formula.constant, `${path}.constant`, errors, questionId, null, null);
  requireInteger(formula.minimum, `${path}.minimum`, errors, questionId, null, null);
  if (formula.maximum !== null) {
    requireInteger(formula.maximum, `${path}.maximum`, errors, questionId, null, null);
  }
  if (
    Number.isInteger(formula.minimum) &&
    Number.isInteger(formula.maximum) &&
    formula.maximum < formula.minimum
  ) {
    errors.push({
      path: `${path}.maximum`,
      message: 'maximum is lower than minimum',
      questionId,
    });
  }
  requireEnum(formula.statRead, STAT_READS, `${path}.statRead`, errors, questionId);
  if (!Array.isArray(formula.terms)) {
    errors.push({ path: `${path}.terms`, message: 'must be an array (empty for a flat amount)', questionId });
    return;
  }
  formula.terms.forEach((term, index) => {
    const termPath = `${path}.terms[${index}]`;
    if (!isObject(term)) {
      errors.push({ path: termPath, message: 'must be an object', questionId });
      return;
    }
    rejectUnknown(term, ['stat', 'side', 'coefficient'], termPath, errors, questionId);
    requireEnum(term.stat, STATS, `${termPath}.stat`, errors, questionId);
    requireEnum(term.side, allowedSides, `${termPath}.side`, errors, questionId);
    requireInteger(term.coefficient, `${termPath}.coefficient`, errors, questionId, null, null);
  });
}

function requireLabel(value, path, errors) {
  if (value !== LAB_LABEL) {
    errors.push({ path, message: 'must be "EXPERIMENTAL"', questionId: null });
  }
}

function requireEnum(value, allowed, path, errors, questionId) {
  if (!allowed.includes(value)) {
    errors.push({
      path,
      message: `must be one of ${allowed.map((item) => JSON.stringify(item)).join(', ')}`,
      questionId,
    });
  }
}

function requireBoolean(value, path, errors, questionId) {
  if (typeof value !== 'boolean') {
    errors.push({ path, message: 'must be true or false', questionId });
  }
}

function requireNull(value, path, errors, questionId) {
  if (value !== null) {
    errors.push({ path, message: 'must be null so an unused value is not a hidden rule', questionId });
  }
}

function requireInteger(value, path, errors, questionId, min, max) {
  if (!Number.isInteger(value)) {
    errors.push({ path, message: 'must be an integer', questionId });
    return false;
  }
  if (min !== null && value < min) {
    errors.push({ path, message: `must be >= ${min}`, questionId });
    return false;
  }
  if (max !== null && value > max) {
    errors.push({ path, message: `must be <= ${max}`, questionId });
    return false;
  }
  return true;
}

function rejectUnknown(object, allowed, path, errors, questionId) {
  if (!isObject(object)) return;
  const permitted = new Set(allowed);
  for (const key of Object.keys(object)) {
    if (!permitted.has(key)) {
      errors.push({ path: `${path}.${key}`, message: `unknown field "${key}"`, questionId });
    }
  }
}

function sameList(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
