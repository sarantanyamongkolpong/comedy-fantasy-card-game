import { BASE_AP, HAND_SIZE } from '../../src/schema/constants.js';
import { ACTION_TYPES, FIXED_RULES } from './vocabulary.js';

/**
 * Structural checks that do not depend on a policy's choices.
 * Assumes `config` already passed validateConfig.
 * @param {object} config
 */
export function analyzeStatic(config) {
  const cards = listCards(config);
  const payable = cards.map((card) => ({
    ...card,
    maxPayableAp: maxPayableAp(config, card),
  }));
  const inDeck = payable.filter((card) => card.inDeck);
  const maxSpendableAp = inDeck.reduce((max, card) => Math.max(max, card.maxPayableAp.ap), BASE_AP);
  const impossibleAp = payable
    .filter((card) => card.cost > card.maxPayableAp.ap)
    .map((card) => ({
      actionType: card.actionType,
      index: card.index,
      cost: card.cost,
      inDeck: card.inDeck,
      maxPayableAp: card.maxPayableAp.ap,
      reason: card.maxPayableAp.reason,
    }));
  const unreachable = [];
  for (const actionType of ACTION_TYPES) {
    const count = countOf(config, actionType);
    if (count === 0) unreachable.push({ actionType, reason: 'notInDeck' });
    const typeCap = config.parameters.actionLimit.maxByType[actionType];
    if (typeCap === 0 || config.parameters.actionLimit.maxPlays === 0) {
      unreachable.push({ actionType, reason: 'forbiddenByActionLimit' });
    }
  }
  const impossibleTypes = new Set(impossibleAp.filter((row) => row.inDeck).map((row) => row.actionType));
  for (const actionType of impossibleTypes) {
    unreachable.push({ actionType, reason: 'impossibleApCost' });
  }
  const policyOmitted = {
    sideA: omittedBy(config.policies.sideA),
    sideB: omittedBy(config.policies.sideB),
  };
  return {
    baseAp: BASE_AP,
    handSize: HAND_SIZE,
    maxSpendableAp,
    maxSpendableNote:
      'Maximum AP from which some in-deck card can still be paid in one turn under the supplied costs, grants, and action limit. Grants do not carry across turns.',
    impossibleAp,
    unreachable,
    policyOmitted,
    buffDoesNotAffectFormulas: buffUnread(config),
    fixedRules: FIXED_RULES,
  };
}

/**
 * Action types with no plays on either side.
 * @param {{ plays: Record<string, Record<string, number>> }} battle
 */
export function neverPlayedTypes(battle) {
  const played = new Set();
  for (const side of ['A', 'B']) {
    for (const actionType of ACTION_TYPES) {
      if (battle.plays[side][actionType] > 0) played.add(actionType);
    }
  }
  return ACTION_TYPES.filter((actionType) => !played.has(actionType));
}

function omittedBy(policy) {
  const priority = new Set(policy.priority);
  return ACTION_TYPES.filter((actionType) => !priority.has(actionType));
}

function buffUnread(config) {
  if (config.parameters.skill.kind !== 'buffStat') return false;
  const formulas = [config.parameters.damage.atk, config.parameters.hp.pool];
  if (config.parameters.damage.defCard.amount) formulas.push(config.parameters.damage.defCard.amount);
  if (config.parameters.skill.amount) formulas.push(config.parameters.skill.amount);
  return formulas.every((formula) => formula.statRead !== 'basePlusMarkerBonus');
}

function listCards(config) {
  const rows = [];
  for (const actionType of ACTION_TYPES) {
    const count = countOf(config, actionType);
    if (count === 0) {
      rows.push({
        actionType,
        index: null,
        cost: costAt(config, actionType, null),
        inDeck: false,
      });
      continue;
    }
    for (let index = 0; index < count; index += 1) {
      rows.push({
        actionType,
        index,
        cost: costAt(config, actionType, index),
        inDeck: true,
      });
    }
  }
  return rows;
}

/**
 * @param {object} config
 * @param {string} actionType
 * @param {number | null} index
 */
export function costAt(config, actionType, index) {
  if (index !== null) {
    const override = config.parameters.apCost.perCard.find(
      (entry) => entry.actionType === actionType && entry.index === index,
    );
    if (override) return override.cost;
  }
  return config.parameters.apCost.byActionType[actionType];
}

function countOf(config, actionType) {
  const entry = config.parameters.deck.composition.find((row) => row.actionType === actionType);
  return entry ? entry.count : 0;
}

/**
 * AP available to pay this card after optional positive-net skill helpers.
 * The card itself is held in hand, so it takes one slot.
 * @param {object} config
 * @param {{ actionType: string, cost: number, inDeck: boolean, index: number | null }} card
 */
function maxPayableAp(config, card) {
  const limit = config.parameters.actionLimit;
  if (limit.maxPlays === 0) {
    return { ap: 0, reason: 'maxPlays is 0, so no card can be paid' };
  }
  if (limit.maxByType[card.actionType] === 0) {
    return { ap: 0, reason: `${card.actionType} plays are capped at 0` };
  }
  const grant = config.parameters.skill.grantsAp;
  let helperCap = HAND_SIZE - 1;
  if (limit.maxPlays !== null) helperCap = Math.min(helperCap, limit.maxPlays - 1);
  const skillCap = limit.maxByType.Skill;
  if (card.actionType === 'Skill') {
    if (skillCap !== null) helperCap = Math.min(helperCap, skillCap - 1);
  } else if (skillCap !== null) {
    helperCap = Math.min(helperCap, skillCap);
  }
  if (helperCap < 0) helperCap = 0;

  let helpers = [];
  for (let index = 0; index < countOf(config, 'Skill'); index += 1) {
    helpers.push(costAt(config, 'Skill', index));
  }
  if (card.actionType === 'Skill' && card.inDeck) {
    const removeAt = helpers.indexOf(card.cost);
    if (removeAt >= 0) helpers.splice(removeAt, 1);
  }
  helpers = helpers.filter((helperCost) => grant > helperCost).sort((left, right) => left - right);
  helpers = helpers.slice(0, helperCap);

  let ap = BASE_AP;
  let played = 0;
  for (const helperCost of helpers) {
    if (ap < helperCost) break;
    ap = ap - helperCost + grant;
    played += 1;
  }
  if (played === 0) {
    return {
      ap,
      reason:
        card.cost <= BASE_AP
          ? `payable from base AP (${BASE_AP}) at turn start`
          : `cost exceeds base AP (${BASE_AP}) and no positive-net helper skill can be paid first`,
    };
  }
  return {
    ap,
    reason: `base AP plus ${played} positive-net helper skill play(s) granting ${grant} AP`,
  };
}
