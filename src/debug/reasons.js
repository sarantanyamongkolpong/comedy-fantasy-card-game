/**
 * Display tokens for question ids that already exist on DesignBlockedError.
 * These names do not add rules. Unknown ids are shown unchanged.
 */
const REASON_BY_QUESTION = Object.freeze({
  'Q-DAMAGE': 'DAMAGE_FORMULA_TBD',
  'Q-SKILL': 'SKILL_EFFECT_TBD',
  'Q-AP-COST': 'AP_COST_TBD',
  'Q-ACTION-LIMIT': 'ACTION_LIMIT_TBD',
  'Q-HP': 'HP_REPRESENTATION_TBD',
  'Q-SPD-AGG': 'TEAM_SPD_AGGREGATION_TBD',
  'Q-SPD-TIE': 'SPD_TIE_BREAK_TBD',
  'Q-SIMULTANEOUS': 'SIMULTANEOUS_DEFEAT_TBD',
  'Q-DECK-SIZE': 'DECK_SIZE_TBD',
  'Q-DRAW-DISCARD': 'DRAW_DISCARD_TBD',
  'Q-GACHA': 'GACHA_RATE_TBD',
  'Q-UPGRADE': 'UPGRADE_FORMULA_TBD',
});

/**
 * @param {string | undefined} questionId
 */
export function reasonForQuestion(questionId) {
  if (typeof questionId !== 'string' || questionId.length === 0) return 'BLOCKED_BY_DESIGN';
  return REASON_BY_QUESTION[questionId] ?? questionId;
}

export function knownReasonTokens() {
  return Object.values(REASON_BY_QUESTION);
}
