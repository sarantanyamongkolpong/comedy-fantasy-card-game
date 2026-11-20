/**
 * Football auto-sim coefficients.
 * Every number in this object is BALANCE_PLACEHOLDER.
 * status is PROPOSED. These are not official match statistics.
 * Callers may pass a partial override; `simulateFootball` merges it.
 */
export const FOOTBALL_TUNING = Object.freeze({
  balance: 'BALANCE_PLACEHOLDER',
  status: 'PROPOSED',
  rewards: Object.freeze({
    G: 24,
    balance: 'BALANCE_PLACEHOLDER',
    status: 'PROPOSED',
  }),
  /** Regulation is two halves. Extra time is opt-in via tactics.extraTime. */
  halfMinutes: 45,
  extraHalfMinutes: 15,
  maxSubs: 5,
  /** First minute an ordinary tiredness sub is allowed. */
  subMinute: 58,
  /** Stamina fraction at or below this, inside the window, triggers a sub. */
  subStamina: 0.46,
  /** Below this fraction a sub is attempted even before the window. */
  urgentStamina: 0.3,
  gkSubStamina: 0.28,
  halftimeRecover: 0.22,
  drainPerMinute: 0.78,
  staminaPoolBase: 34,
  staminaPoolPerSta: 1.05,
  /** Effective-stat floor when the pool is empty. */
  fatigueFloor: 0.64,
  roleDrain: Object.freeze({
    GK: 0.58,
    CB: 0.8,
    FB: 0.98,
    WB: 1.16,
    DM: 0.92,
    CM: 1,
    AM: 1.04,
    W: 1.08,
    ST: 0.94,
  }),
  notableBase: 0.3,
  notableMin: 0.12,
  notableMax: 0.5,
  threatNorm: 55,
  foulShare: 0.14,
  /** Multiplied by press and the defender's transition risk. Active involvement only. */
  offsideBase: 0.16,
  injuryChance: 0.0035,
  goalBase: 0.145,
  goalSlope: 0.16,
  gkSlope: 0.08,
  goalMin: 0.035,
  goalMax: 0.36,
  saveBase: 0.26,
  saveSlope: 0.14,
  /** Per-team match sharpness, inclusive range. Mean is 1 when min/max are symmetric. */
  formMin: 0.88,
  formMax: 1.12,
  kOpen: 0.045,
  kWall: 0.045,
  kCentral: 0.04,
  kTired: 0.035,
  kBox: 0.028,
  contextMin: 0.93,
  contextMax: 1.07,
  coach: Object.freeze({
    positionalAcc: 0.035,
    positionalCompact: 0.04,
    highlinePress: 0.07,
    highlineTransition: 0.05,
    wingbackWidth: 0.045,
    wingbackRelief: 0.12,
    /** Small compactness bump when a wingback coach is stuck in a back four. */
    wingbackOtherCompact: 0.02,
    adaptiveDamp: 0.3,
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
