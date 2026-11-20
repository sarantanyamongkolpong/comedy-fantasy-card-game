/**
 * Sport save payload, schema 3.
 *
 * The card-game envelope stays at SAVE_VERSION 2 so a version 1 or 2 profile
 * still reports saveVersion 2 after load (v0.5 tests depend on that). The v3
 * change is the added `profile.sport` object. Currency G, avatar pity, inventory,
 * and the battle reward ledger are copied and never rewritten.
 */

export const SPORT_SAVE_VERSION = 3;

export function emptySportState() {
  return { roster: {}, pity: {}, ledger: [] };
}

function copyBag(value, label) {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return { ...value };
}

/**
 * Add `sport: { roster, pity, ledger }` when it is missing.
 * Existing sport fields are kept. The input is not mutated.
 * @param {object} profile
 */
export function migrateSportV3(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new TypeError('profile is required');
  }
  const next = structuredClone(profile);
  if (next.sport == null) {
    next.sport = emptySportState();
    return next;
  }
  if (typeof next.sport !== 'object' || Array.isArray(next.sport)) {
    throw new TypeError('profile.sport must be an object when present');
  }
  const sport = { ...next.sport };
  sport.roster = copyBag(sport.roster, 'sport.roster');
  sport.pity = copyBag(sport.pity, 'sport.pity');
  if (sport.ledger == null) sport.ledger = [];
  else if (!Array.isArray(sport.ledger)) throw new TypeError('sport.ledger must be an array');
  next.sport = sport;
  return next;
}
