/**
 * SINGLE tuning file for the sim-race stream (car, moto, sport gacha, sport rewards).
 *
 * Every number below is an invented placeholder for a playable preview.
 * balance: BALANCE_PLACEHOLDER. status: PROPOSED.
 * These are not official FIA, F1, FIM, or MotoGP measurements, points, or odds.
 * Nothing here is owner-approved.
 */

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export const TUNING = deepFreeze({
  balance: 'BALANCE_PLACEHOLDER',
  status: 'PROPOSED',
  noiseAmp: 100,
  dnfPerMil: 14,
  dnfSplit: 40,
  riskStepPerMil: 6,
  safetyPerMil: 45,
  bunchGapMs: 90,
  gridPenaltyMs: 180,
  pitLossMs: 21000,
  wearGripLoss: 2,
  maxLaps: 20,
  gacha: {
    epicPity: 100,
    exPity: 200,
    costG: 100,
    weights: { N: 70, R: 22, Epic: 7, EX: 1 },
  },
  rewards: {
    participationG: 8,
    perPointG: 3,
  },
  points: {
    car: {
      gp: [12, 10, 8, 6, 5, 4, 3, 2, 1],
      sprint: [6, 5, 4, 3, 2, 1],
    },
    moto: {
      gp: [12, 10, 8, 6, 5, 4, 3, 2, 1],
      sprint: [6, 5, 4, 3, 2, 1],
    },
  },
  tyres: {
    S: { dryGrip: 112, dampGrip: 72, wetGrip: 42, wear: 9 },
    M: { dryGrip: 104, dampGrip: 80, wetGrip: 50, wear: 6 },
    H: { dryGrip: 96, dampGrip: 86, wetGrip: 58, wear: 3 },
    Inter: { dryGrip: 78, dampGrip: 108, wetGrip: 92, wear: 5 },
    Wet: { dryGrip: 66, dampGrip: 96, wetGrip: 116, wear: 4 },
  },
  car: {
    gpLaps: 12,
    sprintLaps: 6,
  },
  moto: {
    gpLaps: 12,
    sprintLaps: 6,
    staminaStart: 100,
    staminaPerLap: 4,
    staminaPaceBelow: 45,
  },
});

function merge(base, override) {
  if (Array.isArray(override)) return override.slice();
  if (override && typeof override === 'object') {
    const out = base && typeof base === 'object' && !Array.isArray(base) ? { ...base } : {};
    for (const key of Object.keys(override)) out[key] = merge(out[key], override[key]);
    return out;
  }
  return override;
}

/**
 * Clone the placeholder tuning and overlay a caller patch.
 * The exported TUNING object is frozen and is never mutated.
 * @param {object} [override]
 */
export function resolveTuning(override) {
  const base = structuredClone(TUNING);
  if (!override || typeof override !== 'object') return base;
  return merge(base, override);
}
