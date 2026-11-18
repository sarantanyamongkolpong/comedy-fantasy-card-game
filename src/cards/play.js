import { validateActionCard } from '../schema/validate.js';

/**
 * Resolve a cost from card data when the card carries an integer.
 * A null cost uses `rules.resolveApCost`, which throws Q-AP-COST by default.
 * @param {object} card
 * @param {{ resolveApCost?: Function }} rules
 */
export function resolveApCost(card, rules) {
  if (!card) throw new TypeError('card is required');
  if (card.apCost !== null && card.apCost !== undefined) {
    if (!Number.isInteger(card.apCost) || card.apCost < 0) {
      return { ok: false, reason: 'INVALID_AP_COST' };
    }
    return { ok: true, cost: card.apCost, source: 'card' };
  }
  if (typeof rules?.resolveApCost !== 'function') {
    const error = new TypeError('resolveApCost rule is required when apCost is null');
    error.reason = 'AP_COST_RULE_MISSING';
    throw error;
  }
  const value = rules.resolveApCost(card);
  if (Number.isInteger(value) && value >= 0) {
    return { ok: true, cost: value, source: 'rule' };
  }
  if (value && Number.isInteger(value.cost) && value.cost >= 0) {
    return { ok: true, cost: value.cost, source: 'rule' };
  }
  return { ok: false, reason: 'INVALID_AP_COST' };
}

/**
 * Affordability against a known AP pool. Does not apply action limits or effects.
 * @param {{ card: object, inHand: boolean, ap: number | null, rules: object }} input
 */
export function assessAffordability(input) {
  const structural = assessStructure(input);
  if (!structural.ok) return structural;
  const costResult = resolveApCost(input.card, input.rules);
  if (!costResult.ok) return costResult;
  if (input.ap === null || input.ap === undefined) {
    return { ok: false, reason: 'AP_UNAVAILABLE', cost: costResult.cost };
  }
  if (!Number.isInteger(input.ap) || input.ap < 0) {
    return { ok: false, reason: 'AP_INVALID', cost: costResult.cost };
  }
  if (costResult.cost > input.ap) {
    return { ok: false, reason: 'INSUFFICIENT_AP', cost: costResult.cost, ap: input.ap };
  }
  return { ok: true, cost: costResult.cost, costSource: costResult.source, ap: input.ap };
}

/**
 * Full play check, including the per-turn action-limit hook.
 * The default hook throws Q-ACTION-LIMIT.
 * @param {{ card: object, inHand: boolean, ap: number | null, rules: object, playsThisTurn: number }} input
 */
export function assessActionPlay(input) {
  const affordability = assessAffordability(input);
  if (!affordability.ok) return affordability;
  if (typeof input.rules?.perTurnActionLimit !== 'function') {
    const error = new TypeError('perTurnActionLimit rule is required');
    error.reason = 'ACTION_LIMIT_RULE_MISSING';
    throw error;
  }
  const limit = input.rules.perTurnActionLimit({
    card: input.card,
    ap: input.ap,
    playsThisTurn: input.playsThisTurn,
    cost: affordability.cost,
  });
  if (limit === true || (limit && limit.ok === true)) {
    return affordability;
  }
  if (limit && limit.ok === false) {
    return { ok: false, reason: limit.reason || 'ACTION_LIMIT', cost: affordability.cost };
  }
  throw new TypeError('perTurnActionLimit must return { ok: boolean }');
}

function assessStructure(input) {
  if (!input?.card) return { ok: false, reason: 'CARD_MISSING' };
  if (!input.inHand) return { ok: false, reason: 'NOT_IN_HAND' };
  if (input.card.cardKind !== 'action_card') return { ok: false, reason: 'NOT_ACTION_CARD' };
  const errors = validateActionCard(input.card);
  if (errors.length > 0) return { ok: false, reason: 'INVALID_CARD', errors };
  return { ok: true };
}
