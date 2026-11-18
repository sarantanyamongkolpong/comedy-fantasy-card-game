import { DesignBlockedError } from './errors.js';

/**
 * Default rules. Every function throws. Tests inject replacements.
 * None of these functions encode a deck size, cost, formula, rate, or tie-break.
 */
export function defaultRules() {
  return {
    teamSpd() {
      throw new DesignBlockedError(
        'team SPD aggregation — how four avatar SPD values become one team SPD',
        'Q-SPD-AGG',
      );
    },
    spdTieBreak() {
      throw new DesignBlockedError('SPD tie-break rule', 'Q-SPD-TIE');
    },
    isSideDefeated() {
      throw new DesignBlockedError('HP representation', 'Q-HP');
    },
    simultaneousDefeat() {
      throw new DesignBlockedError('simultaneous defeat', 'Q-SIMULTANEOUS');
    },
    perTurnActionLimit() {
      throw new DesignBlockedError('per-turn action limits', 'Q-ACTION-LIMIT');
    },
    resolveApCost() {
      throw new DesignBlockedError('AP costs of cards', 'Q-AP-COST');
    },
    draw() {
      throw new DesignBlockedError('draw/discard rules', 'Q-DRAW-DISCARD');
    },
    discard() {
      throw new DesignBlockedError('draw/discard rules', 'Q-DRAW-DISCARD');
    },
    deckSize() {
      throw new DesignBlockedError('deck size', 'Q-DECK-SIZE');
    },
    damage() {
      throw new DesignBlockedError('damage formula', 'Q-DAMAGE');
    },
    skillEffect() {
      throw new DesignBlockedError('skill effects', 'Q-SKILL');
    },
    gachaRate() {
      throw new DesignBlockedError('gacha rates', 'Q-GACHA');
    },
    upgrade() {
      throw new DesignBlockedError('upgrade formulas', 'Q-UPGRADE');
    },
  };
}

/**
 * @param {Record<string, Function>} [overrides]
 */
export function resolveRules(overrides = {}) {
  if (overrides === null || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new TypeError('rules must be an object');
  }
  const rules = defaultRules();
  for (const [key, value] of Object.entries(overrides)) {
    if (!(key in rules)) {
      throw new TypeError(`Unknown rule "${key}"`);
    }
    if (typeof value !== 'function') {
      throw new TypeError(`Rule "${key}" must be a function`);
    }
    rules[key] = value;
  }
  return rules;
}
