/**
 * Evaluate an explicit linear formula. Clamp order is minimum, then maximum.
 * @param {{ constant: number, terms: { stat: string, side: string, coefficient: number }[], minimum: number, maximum: number | null, statRead: string }} formula
 * @param {Record<string, object>} roles
 */
export function evaluateFormula(formula, roles) {
  let value = formula.constant;
  for (const term of formula.terms) {
    const avatar = roles[term.side];
    if (!avatar) {
      throw new TypeError(`formula side "${term.side}" has no avatar in this effect`);
    }
    value += term.coefficient * readStat(avatar, term.stat, formula.statRead);
  }
  if (value < formula.minimum) value = formula.minimum;
  if (formula.maximum !== null && value > formula.maximum) value = formula.maximum;
  if (!Number.isInteger(value)) {
    throw new TypeError('formula produced a non-integer; stats, bonuses, and coefficients must stay integers');
  }
  return value;
}

/**
 * @param {object} avatar
 * @param {string} stat
 * @param {string} statRead
 */
export function readStat(avatar, stat, statRead) {
  const base = avatar.stats?.[stat];
  if (!Number.isInteger(base)) {
    throw new TypeError(`stat ${stat} is not an integer`);
  }
  if (statRead === 'base') return base;
  const bonus = avatar.markers?.bonus?.[stat];
  if (!Number.isInteger(bonus)) {
    throw new TypeError(`marker bonus for ${stat} is not an integer`);
  }
  return base + bonus;
}
