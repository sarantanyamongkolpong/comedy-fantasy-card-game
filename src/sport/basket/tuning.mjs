/**
 * Basketball auto-sim coefficients.
 * Every number in this object is BALANCE_PLACEHOLDER.
 * status is PROPOSED. These are not official box-score statistics.
 *
 * Rule-shaped constants that follow the owner brief (5 on court, 4×10,
 * 5-minute overtime, 24-second shot clock, 8-second backcourt, foul-out at 5)
 * are still carried here so a review can retune them without a code edit.
 * Team-foul bonus and the shot-clock reset after an offensive rebound are
 * PROPOSED simplifications, not a claim about a numbered article.
 */
export const BASKET_TUNING = Object.freeze({
  balance: 'BALANCE_PLACEHOLDER',
  status: 'PROPOSED',
  rewards: Object.freeze({
    G: 22,
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  }),
  quarterSeconds: 600,
  quarters: 4,
  overtimeSeconds: 300,
  shotClock: 24,
  backcourtSeconds: 8,
  foulOut: 5,
  /** Non-shooting fouls become free throws once a team reaches this count in the period. */
  teamFoulBonus: 5,
  maxOvertimePeriods: 12,
  /** Reset used after an offensive rebound. Full clock; not asserted as a 14s rule. */
  shotClockReset: 24,
  make2: 0.5,
  make3: 0.35,
  skillWeight: 0.2,
  contestWeight: 0.14,
  defWeight: 0.1,
  /** Added to make probability. Each team draws ±nightAmp once per match. */
  nightAmp: 0.04,
  threeBase: 0.33,
  threeGuard: 0.07,
  threeBig: 0.1,
  threeZoneBump: 0.05,
  tovBase: 0.11,
  tovEdge: 0.07,
  foulBase: 0.1,
  shootingFoulShare: 0.62,
  ftBase: 0.7,
  ftSlope: 0.16,
  offRebBase: 0.27,
  assistRate: 0.56,
  blockChance: 0.055,
  stealShare: 0.42,
  drainPerSecond: 0.042,
  staminaBase: 58,
  staminaPerSta: 0.5,
  fatigueFloor: 0.74,
  subFrac: 0.4,
  subFresh: 0.7,
  /** No tiredness sub inside this many seconds at the end of Q4 or overtime. */
  clutchSeconds: 90,
  quarterRecover: 12,
  starChase: 0.06,
  matchupSpreadCap: 0.08,
  maxOffRebChain: 3,
  pace: Object.freeze({
    grind: Object.freeze({
      mean: 18, spread: 5, min: 12, violation: 0.018, backcourt: 0.01, quality: 0.018, drain: 0.84, foul: 0.92,
    }),
    balanced: Object.freeze({
      mean: 15, spread: 5, min: 9, violation: 0.032, backcourt: 0.012, quality: 0, drain: 1, foul: 1,
    }),
    push: Object.freeze({
      mean: 12, spread: 4, min: 7, violation: 0.05, backcourt: 0.016, quality: -0.018, drain: 1.18, foul: 1.06,
    }),
  }),
  coach: Object.freeze({
    movementMake: 0.016,
    disciplineDrain: 0.9,
    clutchMake: 0.018,
  }),
});

/**
 * @param {object} base
 * @param {object | undefined} override
 */
export function mergeTuning(base, override) {
  if (!override) return base;
  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = base[key];
    if (isPlain(value) && isPlain(current)) merged[key] = mergeTuning(current, value);
    else merged[key] = value;
  }
  return merged;
}

function isPlain(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
